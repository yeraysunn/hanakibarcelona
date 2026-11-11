// POST /api/reservas/admin/cierres {fecha, horas: ['HH:MM', ...], cerrar: true|false}
// Cierra o vuelve a abrir horas concretas de un día (para un turno o el día entero se mandan todas sus horas)
import { json, db, handle, body, HttpError, tabla, validarFecha, horasCerradas, TODAS_HORAS } from '../_comun.js';

export const onRequestPost = handle(async ({ request, env }) => {
  const DB = db(env);
  await tabla(DB);
  const d = await body(request);
  const fecha = String(d.fecha || '');
  validarFecha(fecha);
  const horas = [...new Set((Array.isArray(d.horas) ? d.horas : []).map(String))].filter((h) => TODAS_HORAS.includes(h));
  if (!horas.length) throw new HttpError(400, 'Elige al menos una hora.');
  const sql = d.cerrar
    ? 'INSERT OR IGNORE INTO reservas_cierres (fecha, hora) VALUES (?, ?)'
    : 'DELETE FROM reservas_cierres WHERE fecha = ? AND hora = ?';
  await DB.batch(horas.map((h) => DB.prepare(sql).bind(fecha, h)));
  return json({ ok: true, fecha, cerradas: await horasCerradas(DB, fecha) });
});
