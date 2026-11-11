// GET /api/fidelidad/tarjeta?t=TOKEN — estado de la tarjeta del cliente (puntos, tienda y últimos movimientos)
import { json, dbListo, handle, HttpError, tarjetaPublica, listaPremios } from './_lib.js';

export const onRequestGet = handle(async ({ request, env }) => {
  const t = new URL(request.url).searchParams.get('t') || '';
  if (!/^[a-f0-9]{32}$/.test(t)) throw new HttpError(404, 'Tarjeta no encontrada.');
  const DB = await dbListo(env);
  const socio = await DB.prepare('SELECT * FROM socios WHERE token = ?').bind(t).first();
  if (!socio) throw new HttpError(404, 'Tarjeta no encontrada.');
  const mov = await DB.prepare(`SELECT m.tipo, m.puntos, m.importe, m.nota, m.creado, p.nombre AS premio
    FROM movimientos m LEFT JOIN premios p ON p.id = m.premio_id
    WHERE m.socio_id = ? AND m.puntos IS NOT NULL ORDER BY m.id DESC LIMIT 12`).bind(socio.id).all();
  return json({ tarjeta: tarjetaPublica(socio, await listaPremios(DB), mov.results) });
});
