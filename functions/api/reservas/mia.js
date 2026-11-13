// «Mi reserva» — el cliente gestiona su reserva con el enlace privado de sus emails (/reservas/mi-reserva?t=TOKEN)
// GET  /api/reservas/mia?t=TOKEN                          → datos de la reserva y si aún se puede cambiar
// POST /api/reservas/mia {t, accion: 'cambiar', fecha, hora, adultos, ninos, bebes, comentarios}
// POST /api/reservas/mia {t, accion: 'cancelar'}
// Hasta HORAS_LIMITE_CAMBIO horas antes y MAX_CAMBIOS cambios. Un cambio vuelve a dejarla pendiente y avisa por Telegram.
import { json, db, handle, body, HttpError, enviarEmail, tabla, emailReserva, validarDatos, editable, horasCerradas, HORAS, HORAS_LIMITE_CAMBIO, MAX_CAMBIOS, DIAS_ANTELACION, MAX_PERSONAS } from './_comun.js';
import { notificarTelegram } from './_telegram.js';

const TOKEN = /^[a-f0-9]{32}$/;

async function buscar(DB, t) {
  if (!TOKEN.test(String(t || ''))) throw new HttpError(404, 'Este enlace no es válido. Si necesitas cambiar tu reserva, llámanos al 931 94 22 61.');
  const r = await DB.prepare('SELECT * FROM reservas WHERE token = ?').bind(t).first();
  if (!r) throw new HttpError(404, 'No encontramos esta reserva. Si necesitas ayuda, llámanos al 931 94 22 61.');
  return r;
}

// Solo lo que necesita ver el cliente (nada del panel)
const publica = (r) => ({
  nombre: r.nombre, fecha: r.fecha, hora: r.hora, adultos: r.adultos, ninos: r.ninos, bebes: r.bebes,
  comentarios: r.comentarios || '', estado: r.estado, editable: editable(r), cambios_restantes: Math.max(0, MAX_CAMBIOS - (r.cambios || 0)),
});

export const onRequestGet = handle(async ({ request, env }) => {
  const DB = db(env);
  await tabla(DB);
  const r = await buscar(DB, new URL(request.url).searchParams.get('t'));
  return json({ reserva: publica(r), horas: HORAS, cerradas: await horasCerradas(DB, r.fecha), limite_horas: HORAS_LIMITE_CAMBIO, dias_antelacion: DIAS_ANTELACION, max_personas: MAX_PERSONAS },
    200, { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' });
});

export const onRequestPost = handle(async (ctx) => {
  const { request, env } = ctx;
  const DB = db(env);
  await tabla(DB);
  const d = await body(request);
  const antes = await buscar(DB, d.t);
  if (!editable(antes)) {
    throw new HttpError(409, ['cancelada', 'llego', 'no_vino'].includes(antes.estado)
      ? 'Esta reserva ya no se puede cambiar.'
      : `Faltan menos de ${HORAS_LIMITE_CAMBIO} horas: para cambiarla o cancelarla llámanos al 931 94 22 61.`);
  }
  const base = new URL(request.url).origin;
  let r, tipoEmail, tipoTelegram;

  if (d.accion === 'cancelar') {
    r = await DB.prepare(`UPDATE reservas SET estado = 'cancelada', por_cliente = 1, actualizado = datetime('now') WHERE id = ? RETURNING *`).bind(antes.id).first();
    tipoEmail = 'cancelada_cliente'; tipoTelegram = 'cancelada';
  } else if (d.accion === 'cambiar') {
    if ((antes.cambios || 0) >= MAX_CAMBIOS) throw new HttpError(429, 'Ya has cambiado esta reserva varias veces. Para otro cambio, llámanos al 931 94 22 61.');
    const v = await validarDatos(DB, d, antes);
    const comentarios = d.comentarios === undefined ? antes.comentarios : (String(d.comentarios || '').trim().slice(0, 400) || null);
    const igual = v.fecha === antes.fecha && v.hora === antes.hora && v.adultos === antes.adultos && v.ninos === antes.ninos && v.bebes === antes.bebes && (comentarios || null) === (antes.comentarios || null);
    if (igual) return json({ ok: true, sin_cambios: true, reserva: publica(antes) });
    r = await DB.prepare(`UPDATE reservas SET fecha = ?, hora = ?, adultos = ?, ninos = ?, bebes = ?, comentarios = ?,
        estado = 'pendiente', cambios = cambios + 1, por_cliente = 1, actualizado = datetime('now') WHERE id = ? RETURNING *`)
      .bind(v.fecha, v.hora, v.adultos, v.ninos, v.bebes, comentarios, antes.id).first();
    tipoEmail = 'modificada'; tipoTelegram = 'modificada';
  } else throw new HttpError(400, 'Acción no válida.');

  ctx.waitUntil(notificarTelegram(env, r, tipoTelegram, antes));
  if (r.email) {
    try {
      const m = emailReserva(r, tipoEmail, base);
      await enviarEmail(env, { para: r.email, asunto: m.asunto, html: m.html, texto: m.texto, de: 'Hanaki Sushi <reservas@hanakisushi.com>', idem: `hanaki-reserva-${r.id}-${tipoEmail}-${r.cambios || 0}` });
    } catch (e) { console.error('email mi-reserva', e); }
  }
  return json({ ok: true, reserva: publica(r) });
});
