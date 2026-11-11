// Tienda de premios (panel)
//   GET     lista completa (también los ocultos)
//   POST    {id?, nombre, descripcion?, puntos|null, activo, variable}   crea o edita. puntos vacío = «Próximamente»;
//           variable = el precio se escribe al canjear (cada gato lleva el suyo)
//   DELETE  {id}
import { json, dbListo, handle, body, HttpError, listaPremios } from '../_lib.js';

export const onRequestGet = handle(async ({ env }) => json({ premios: await listaPremios(await dbListo(env), true) }));

export const onRequestPost = handle(async ({ request, env }) => {
  const DB = await dbListo(env);
  const d = await body(request);
  const nombre = String(d.nombre || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  if (nombre.length < 2) throw new HttpError(400, 'Escribe el nombre del premio.');
  const descripcion = String(d.descripcion || '').trim().slice(0, 120) || null;
  const variable = d.variable ? 1 : 0;
  let puntos = null;
  if (!variable && d.puntos !== '' && d.puntos != null) {
    puntos = Math.trunc(Number(String(d.puntos).replace(/[.\s]/g, '')));
    if (!Number.isFinite(puntos) || puntos <= 0 || puntos > 10000000) throw new HttpError(400, 'Los puntos tienen que ser un número mayor que 0 (o vacío para «Próximamente»).');
  }
  const activo = d.activo === false || d.activo === 0 ? 0 : 1;
  if (d.id) {
    const r = await DB.prepare('UPDATE premios SET nombre = ?, descripcion = ?, puntos = ?, activo = ?, variable = ? WHERE id = ? RETURNING id').bind(nombre, descripcion, puntos, activo, variable, Number(d.id)).first();
    if (!r) throw new HttpError(404, 'Ese premio ya no existe.');
  } else {
    await DB.prepare('INSERT INTO premios (nombre, descripcion, puntos, activo, variable, orden) VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(orden), 0) + 1 FROM premios))').bind(nombre, descripcion, puntos, activo, variable).run();
  }
  return json({ ok: true, premios: await listaPremios(DB, true) });
});

export const onRequestDelete = handle(async ({ request, env }) => {
  const DB = await dbListo(env);
  const { id } = await body(request);
  await DB.prepare('DELETE FROM premios WHERE id = ?').bind(Number(id)).run();
  return json({ ok: true, premios: await listaPremios(DB, true) });
});
