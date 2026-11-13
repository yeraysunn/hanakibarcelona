// POST /api/reservas/admin/estado {id, estado} — confirmar, cancelar, llegó, no vino
import { json, db, handle, body, HttpError, enviarEmail, tabla, ESTADOS, emailReserva, asegurarToken } from '../_comun.js';
import { programarResena } from '../../_resenas.js';

export const onRequestPost = handle(async ({ request, env, waitUntil }) => {
  const DB = db(env);
  await tabla(DB);
  const { id, estado } = await body(request);
  if (!ESTADOS.includes(estado)) throw new HttpError(400, 'Estado no válido.');
  const antes = await DB.prepare('SELECT * FROM reservas WHERE id = ?').bind(Number(id)).first();
  if (!antes) throw new HttpError(404, 'No se encuentra la reserva.');
  // por_cliente = 0: el personal ya ha visto el último cambio que hizo el cliente
  let r = await DB.prepare(`UPDATE reservas SET estado = ?, por_cliente = 0, actualizado = datetime('now') WHERE id = ? RETURNING *`).bind(estado, antes.id).first();

  let email = null;
  if (r.email && antes.estado !== estado && (estado === 'confirmada' || estado === 'cancelada')) {
    try {
      if (estado === 'confirmada') r = await asegurarToken(DB, r); // reservas antiguas sin enlace «Mi reserva»
      const m = emailReserva(r, estado, new URL(request.url).origin);
      // tras un cambio del cliente, la nueva confirmación lleva otra clave para que sí se envíe
      email = await enviarEmail(env, { para: r.email, asunto: m.asunto, html: m.html, texto: m.texto, de: 'Hanaki Sushi <reservas@hanakisushi.com>', idem: `hanaki-reserva-${r.id}-${estado}-${r.cambios || 0}` });
    } catch { email = 'error'; }
  }
  // Ha venido: al día siguiente le pedimos una reseña en Google (máx. una vez cada 90 días por email)
  if (estado === 'llego' && antes.estado !== 'llego' && r.email) {
    waitUntil(programarResena(env, DB, { email: r.email, nombre: r.nombre, origen: 'reserva', base: new URL(request.url).origin }));
  }
  return json({ ok: true, reserva: r, email });
});
