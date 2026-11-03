// POST /api/reservas/crear — reserva desde la web
import { json, db, handle, body, HttpError, normalizarTelefono, enviarEmail, tabla, TODAS_HORAS, MAX_PERSONAS, DIAS_ANTELACION, hoyMadrid, horaMadrid, validarFecha, emailReserva } from './_comun.js';

const ent = (v, min, max) => Math.max(min, Math.min(max, parseInt(v, 10) || 0));

export const onRequestPost = handle(async ({ request, env }) => {
  const DB = db(env);
  const d = await body(request);
  if (d.web) return json({ ok: true }); // trampa anti-bots
  await tabla(DB);

  const nombre = String(d.nombre || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const telefono = normalizarTelefono(d.telefono);
  const email = String(d.email || '').trim().toLowerCase().slice(0, 120) || null;
  const fecha = String(d.fecha || '');
  const hora = String(d.hora || '');
  const adultos = ent(d.adultos, 0, MAX_PERSONAS), ninos = ent(d.ninos, 0, MAX_PERSONAS), bebes = ent(d.bebes, 0, 10);
  const comentarios = String(d.comentarios || '').trim().slice(0, 400) || null;

  validarFecha(fecha);
  const hoy = hoyMadrid();
  if (fecha < hoy) throw new HttpError(400, 'Ese día ya ha pasado.');
  const limite = new Date(Date.parse(hoy) + DIAS_ANTELACION * 864e5).toISOString().slice(0, 10);
  if (fecha > limite) throw new HttpError(400, `Solo se puede reservar con ${DIAS_ANTELACION} días de antelación como máximo.`);
  if (!TODAS_HORAS.includes(hora)) throw new HttpError(400, 'Elige una hora.');
  if (fecha === hoy && hora <= horaMadrid()) throw new HttpError(400, 'Esa hora ya ha pasado. Elige otra.');
  if (adultos + ninos < 1) throw new HttpError(400, 'Indica cuántas personas venís.');
  if (adultos + ninos + bebes > MAX_PERSONAS) throw new HttpError(400, `Para más de ${MAX_PERSONAS} personas llámanos al 931 94 22 61.`);
  if (nombre.length < 2) throw new HttpError(400, 'Escribe tu nombre.');
  if (!telefono) throw new HttpError(400, 'El teléfono no es válido.');
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'El email no es válido.');
  if (!d.privacidad) throw new HttpError(400, 'Tienes que aceptar la política de privacidad.');

  const { n } = await DB.prepare(`SELECT COUNT(*) n FROM reservas WHERE telefono = ? AND fecha >= ? AND estado IN ('pendiente','confirmada')`).bind(telefono, hoy).first();
  if (n >= 3) throw new HttpError(429, 'Ya tienes varias reservas activas. Llámanos al 931 94 22 61 si necesitas otra.');

  const r = await DB.prepare(`INSERT INTO reservas (fecha, hora, nombre, telefono, email, adultos, ninos, bebes, trona, carrito, cumple, comentarios)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`)
    .bind(fecha, hora, nombre, telefono, email, adultos, ninos, bebes, d.trona ? 1 : 0, d.carrito ? 1 : 0, d.cumple ? 1 : 0, comentarios).first();

  if (email) {
    try {
      const m = emailReserva(r, 'recibida');
      await enviarEmail(env, { para: email, asunto: m.asunto, html: m.html, texto: m.texto, de: 'Hanaki Sushi <reservas@hanakisushi.com>', idem: `hanaki-reserva-${r.id}-recibida` });
    } catch (e) { console.error('email reserva', e); } // la reserva queda guardada aunque falle el email
  }
  return json({ ok: true, reserva: { id: r.id, fecha: r.fecha, hora: r.hora, estado: r.estado } }, 201);
});
