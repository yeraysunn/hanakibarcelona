// Aviso de nueva reserva por Telegram (no crea ninguna ruta)
// Lee TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID (uno o varios separados por coma) de las variables de entorno.
import { fechaLarga, personasTexto } from './_comun.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function notificarTelegram(env, r) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chats = String(env.TELEGRAM_CHAT_ID || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!token || !chats.length) return;

  const extras = [r.trona ? 'trona' : '', r.carrito ? 'carrito' : '', r.cumple ? 'cumpleaños' : ''].filter(Boolean);
  let msg = '🍣 <b>Nueva reserva</b>\n\n';
  msg += `👤 <b>Nombre:</b> ${esc(r.nombre)}\n`;
  msg += `📞 <b>Teléfono:</b> ${esc(r.telefono)}\n`;
  if (r.email) msg += `📧 <b>Email:</b> ${esc(r.email)}\n`;
  msg += `📅 <b>Día:</b> ${esc(fechaLarga(r.fecha))}\n`;
  msg += `🕐 <b>Hora:</b> ${esc(r.hora)}\n`;
  msg += `👥 <b>Personas:</b> ${esc(personasTexto(r))}\n`;
  if (extras.length) msg += `➕ <b>Extras:</b> ${esc(extras.join(', '))}\n`;
  if (r.comentarios) msg += `💬 <b>Comentarios:</b> ${esc(r.comentarios)}\n`;

  for (const chat_id of chats) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text: msg, parse_mode: 'HTML' }),
      });
      if (!res.ok) console.error('telegram: respuesta', res.status); // sin datos del cliente ni token
    } catch (e) {
      console.error('telegram: fallo de red'); // la reserva no debe fallar por esto
    }
  }
}
