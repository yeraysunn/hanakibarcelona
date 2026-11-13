// GET /api/promos/admin/resumen — tipos de mensaje, fotos, cuántos socios hay en cada grupo e historial de envíos
import { json, dbListo, handle } from '../../fidelidad/_lib.js';
import { TIPOS, FOTOS, SEGMENTOS, tablas, destinatarios } from '../_promos.js';

export const onRequestGet = handle(async ({ env }) => {
  const DB = await dbListo(env);
  await tablas(DB);
  const segmentos = {};
  for (const [id, s] of Object.entries(SEGMENTOS)) segmentos[id] = { nombre: s.nombre, n: (await destinatarios(DB, id)).length };
  const totales = await DB.prepare(`SELECT COUNT(*) socios, SUM(acepta_promos = 1) aceptan FROM socios`).first();
  const { results: historial } = await DB.prepare(`SELECT id, tipo, segmento, asunto, destinatarios, enviados, errores, creado, terminado FROM promos ORDER BY id DESC LIMIT 30`).all();
  return json({ tipos: TIPOS, fotos: FOTOS, segmentos, socios: totales?.socios || 0, aceptan: totales?.aceptan || 0, historial });
});
