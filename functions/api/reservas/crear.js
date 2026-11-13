// POST /api/reservas/crear — reserva desde la web
import { json, db, handle, body, HttpError, normalizarTelefono, enviarEmail, tabla, hoyMadrid, emailReserva, validarDatos, nuevoToken } from './_comun.js';
import { notificarTelegram } from './_telegram.js';

export const onRequestPost = handle(async (ctx) => {
  const { request, env } = ctx;
  const DB = db(env);
  const d = await body(request);
  if (d.web) return json({ ok: true }); // trampa anti-bots
  await tabla(DB);

  const nombre = String(d.nombre || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const telefono = normalizarTelefono(d.telefono);
  const email = String(d.email || '').trim().toLowerCase().slice(0, 120) || null;
  const comentarios = String(d.comentarios || '').trim().slice(0, 400) || null;
  const { fecha, hora, adultos, ninos, bebes } = await validarDatos(DB, d);
  if (nombre.length < 2) throw new HttpError(400, 'Escribe tu nombre.');
  if (!telefono) throw new HttpError(400, 'El teléfono no es válido.');
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'El email no es válido.');
  if (!d.privacidad) throw new HttpError(400, 'Tienes que aceptar la política de privacidad.');

  const { n } = await DB.prepare(`SELECT COUNT(*) n FROM reservas WHERE telefono = ? AND fecha >= ? AND estado IN ('pendiente','confirmada')`).bind(telefono, hoyMadrid()).first();
  if (n >= 3) throw new HttpError(429, 'Ya tienes varias reservas activas. Llámanos al 931 94 22 61 si necesitas otra.');

  const r = await DB.prepare(`INSERT INTO reservas (fecha, hora, nombre, telefono, email, adultos, ninos, bebes, trona, carrito, cumple, comentarios, token)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`)
    .bind(fecha, hora, nombre, telefono, email, adultos, ninos, bebes, d.trona ? 1 : 0, d.carrito ? 1 : 0, d.cumple ? 1 : 0, comentarios, nuevoToken()).first();

  ctx.waitUntil(notificarTelegram(env, r)); // aviso al personal sin retrasar la respuesta

  if (email) {
    try {
      const m = emailReserva(r, 'recibida', new URL(request.url).origin);
      await enviarEmail(env, { para: email, asunto: m.asunto, html: m.html, texto: m.texto, de: 'Hanaki Sushi <reservas@hanakisushi.com>', idem: `hanaki-reserva-${r.id}-recibida` });
    } catch (e) { console.error('email reserva', e); } // la reserva queda guardada aunque falle el email
  }
  return json({ ok: true, reserva: { id: r.id, fecha: r.fecha, hora: r.hora, estado: r.estado, token: r.token } }, 201);
});
