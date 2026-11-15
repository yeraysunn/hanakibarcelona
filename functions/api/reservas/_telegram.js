// Avisos de reservas por Telegram (no crea ninguna ruta)
// tipo: 'nueva' | 'modificada' | 'cancelada' (por el cliente desde «Mi reserva»). antes: reserva previa, para enseñar el cambio.
// Lee TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID (uno o varios separados por coma) de las variables de entorno.
import { fechaLarga, personasTexto } from './_comun.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const TITULOS = { nueva: '🍣 <b>Nueva reserva</b>', modificada: '✏️ <b>Reserva cambiada por el cliente</b>', cancelada: '❌ <b>Reserva cancelada por el cliente</b>' };

// Texto del aviso (también se usa al editarlo tras pulsar un botón)
export function textoReserva(r, tipo = 'nueva', antes = null) {
  const extras = [r.trona ? 'trona' : '', r.carrito ? 'carrito' : '', r.cumple ? 'cumpleaños' : ''].filter(Boolean);
  let msg = (TITULOS[tipo] || TITULOS.nueva) + '\n\n';
  msg += `👤 <b>Nombre:</b> ${esc(r.nombre)}\n`;
  msg += `📞 <b>Teléfono:</b> ${esc(r.telefono)}\n`;
  if (r.email) msg += `📧 <b>Email:</b> ${esc(r.email)}\n`;
  msg += `📅 <b>Día:</b> ${esc(fechaLarga(r.fecha))}\n`;
  msg += `🕐 <b>Hora:</b> ${esc(r.hora)}\n`;
  msg += `👥 <b>Personas:</b> ${esc(personasTexto(r))}\n`;
  if (extras.length) msg += `➕ <b>Extras:</b> ${esc(extras.join(', '))}\n`;
  if (r.comentarios) msg += `💬 <b>Comentarios:</b> ${esc(r.comentarios)}\n`;
  if (antes && tipo === 'modificada') msg += `\n↩️ <b>Antes:</b> ${esc(fechaLarga(antes.fecha))}, ${esc(antes.hora)} · ${esc(personasTexto(antes))}\n`;
  if (tipo === 'modificada') msg += '\n⚠️ Vuelve a estar pendiente: confírmala aquí o en el panel.\n';
  return msg;
}

// Botones ✅ Aceptar / ❌ Rechazar (solo en reservas pendientes: nuevas o cambiadas por el cliente)
const botones = (r) => ({ inline_keyboard: [[{ text: '✅ Aceptar', callback_data: `ok:${r.id}` }, { text: '❌ Rechazar', callback_data: `no:${r.id}` }]] });

export async function notificarTelegram(env, r, tipo = 'nueva', antes = null) {
  const token = String(env.TELEGRAM_BOT_TOKEN || '').trim();
  const chats = String(env.TELEGRAM_CHAT_ID || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!token || !chats.length) return;
  const msg = textoReserva(r, tipo, antes);
  const conBotones = r.estado === 'pendiente' && tipo !== 'cancelada';

  for (const chat_id of chats) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text: msg, parse_mode: 'HTML', ...(conBotones ? { reply_markup: botones(r) } : {}) }),
      });
      if (!res.ok) console.error('telegram: respuesta', res.status); // sin datos del cliente ni token
    } catch (e) {
      console.error('telegram: fallo de red'); // la reserva no debe fallar por esto
    }
  }
}

// Llamada a la API de Telegram para el webhook y la configuración. Lanza Error si falla (sin enseñar la clave).
export async function tg(env, metodo, datos) {
  const token = String(env.TELEGRAM_BOT_TOKEN || '').trim();
  if (!token) throw new Error('falta TELEGRAM_BOT_TOKEN');
  let res;
  try {
    res = await fetch(`https://api.telegram.org/bot${token}/${metodo}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos), signal: AbortSignal.timeout(8000) });
  } catch { throw new Error(`telegram ${metodo}: fallo de red`); }
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.ok) { const e = new Error(`telegram ${metodo}: ${res.status} ${j.description || ''}`.trim()); e.descripcion = j.description || ''; throw e; }
  return j.result;
}

// Comparación de secretos en tiempo constante
export function mismoSecreto(a, b) {
  a = String(a || '').trim(); b = String(b || '').trim();
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
