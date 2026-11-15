// Cambio de estado de una reserva por el personal (no crea ninguna ruta).
// La usan el panel (/api/reservas/admin/estado) y los botones de Telegram (/api/telegram/webhook):
// guarda el estado, manda el email al cliente y programa la reseña.
import { HttpError, enviarEmail, ESTADOS, emailReserva, asegurarToken } from './_comun.js';
import { programarResena } from '../_resenas.js';

// soloPendiente: true → solo cambia si sigue pendiente (botones de Telegram); si no, devuelve { ya: true } sin tocar nada.
// rechazo: true → el email es «No tenemos mesa para tu reserva» en vez de «Tu reserva se ha cancelado».
export async function cambiarEstado({ env, DB, base, waitUntil }, id, estado, { soloPendiente = false, rechazo = false } = {}) {
  if (!ESTADOS.includes(estado)) throw new HttpError(400, 'Estado no válido.');
  const antes = await DB.prepare('SELECT * FROM reservas WHERE id = ?').bind(Number(id)).first();
  if (!antes) throw new HttpError(404, 'No se encuentra la reserva.');
  if (soloPendiente && antes.estado !== 'pendiente') return { ya: true, reserva: antes, email: null };
  // por_cliente = 0: el personal ya ha visto el último cambio que hizo el cliente.
  // «AND estado = ?»: si alguien la acaba de cambiar a la vez (panel y Telegram), no se pisa.
  let r = await DB.prepare(`UPDATE reservas SET estado = ?, por_cliente = 0, actualizado = datetime('now') WHERE id = ? AND estado = ? RETURNING *`)
    .bind(estado, antes.id, antes.estado).first();
  if (!r) {
    const ahora = await DB.prepare('SELECT * FROM reservas WHERE id = ?').bind(antes.id).first();
    if (soloPendiente) return { ya: true, reserva: ahora, email: null };
    throw new HttpError(409, 'Esta reserva acaba de cambiar. Recarga la lista.');
  }

  let email = null;
  if (r.email && antes.estado !== estado && (estado === 'confirmada' || estado === 'cancelada')) {
    try {
      if (estado === 'confirmada') r = await asegurarToken(DB, r); // reservas antiguas sin enlace «Mi reserva»
      const m = emailReserva(r, estado === 'cancelada' && rechazo ? 'rechazada' : estado, base);
      // tras un cambio del cliente, la nueva confirmación lleva otra clave para que sí se envíe
      email = await enviarEmail(env, { para: r.email, asunto: m.asunto, html: m.html, texto: m.texto, de: 'Hanaki Sushi <reservas@hanakisushi.com>', idem: `hanaki-reserva-${r.id}-${estado}-${r.cambios || 0}` });
    } catch { email = 'error'; }
  }
  // Ha venido: al día siguiente le pedimos una reseña en Google (máx. una vez cada 90 días por email)
  if (estado === 'llego' && antes.estado !== 'llego' && r.email) {
    waitUntil(programarResena(env, DB, { email: r.email, nombre: r.nombre, origen: 'reserva', base }));
  }
  return { ya: false, reserva: r, email };
}
