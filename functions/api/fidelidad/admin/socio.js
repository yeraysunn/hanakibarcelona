// GET /api/fidelidad/admin/socio?id=…|token=…|codigo=…  ·  DELETE {id} (borrar datos a petición del cliente)
import { json, dbListo, handle, body, HttpError, buscarSocio } from '../_lib.js';

export const onRequestGet = handle(async ({ request, env }) => {
  const DB = await dbListo(env);
  const p = Object.fromEntries(new URL(request.url).searchParams);
  const socio = await buscarSocio(DB, p);
  if (!socio) throw new HttpError(404, 'No se encuentra esa tarjeta.');
  const mov = await DB.prepare('SELECT tipo, tipo_sello, puntos, importe, nota, creado FROM movimientos WHERE socio_id = ? ORDER BY id DESC LIMIT 200').bind(socio.id).all();
  return json({ socio, movimientos: mov.results });
});

export const onRequestDelete = handle(async ({ request, env }) => {
  const DB = await dbListo(env);
  const { id } = await body(request);
  await DB.batch([
    DB.prepare('DELETE FROM movimientos WHERE socio_id = ?').bind(Number(id)),
    DB.prepare('DELETE FROM socios WHERE id = ?').bind(Number(id)),
  ]);
  return json({ ok: true });
});

export const onRequestPost = handle(async () => { throw new HttpError(405, 'Método no permitido.'); });
