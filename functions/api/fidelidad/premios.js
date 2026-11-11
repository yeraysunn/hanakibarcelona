// GET /api/fidelidad/premios — la tienda de premios (pública): qué se puede canjear y por cuántos puntos
import { json, dbListo, handle, listaPremios, reglaPuntos } from './_lib.js';

export const onRequestGet = handle(async ({ env }) => {
  const DB = await dbListo(env);
  const premios = (await listaPremios(DB)).map((p) => ({ id: p.id, nombre: p.nombre, descripcion: p.descripcion || '', puntos: p.variable ? null : p.puntos, variable: !!p.variable }));
  return json({ regla: reglaPuntos(), premios }, 200, { 'cache-control': 'public, max-age=60' });
});
