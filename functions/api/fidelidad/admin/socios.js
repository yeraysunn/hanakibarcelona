// GET /api/fidelidad/admin/socios?q=texto — lista de socios + estadísticas
import { json, dbListo, handle, SELLOS_PREMIO, TIPOS, TIPO_IDS } from '../_lib.js';

export const onRequestGet = handle(async ({ request, env }) => {
  const DB = await dbListo(env);
  const q = (new URL(request.url).searchParams.get('q') || '').trim();

  let sql = 'SELECT id, token, codigo, nombre, telefono, email, acepta_promos, sellos_mediodia, sellos_noche, sellos_menu, premios_mediodia, premios_noche, premios_menu, sellos_totales, premios, creado, ultimo_sello FROM socios';
  const args = [];
  if (q) {
    const like = '%' + q.replace(/[%_]/g, '') + '%';
    const digitos = q.replace(/\D/g, '');
    sql += ' WHERE nombre LIKE ? OR codigo = ? OR email LIKE ?' + (digitos.length >= 3 ? ' OR telefono LIKE ?' : '');
    args.push(like, q.toUpperCase(), like);
    if (digitos.length >= 3) args.push('%' + digitos + '%');
  }
  sql += ' ORDER BY COALESCE(ultimo_sello, creado) DESC LIMIT 500';

  const [lista, tot, hoy, semana] = await DB.batch([
    DB.prepare(sql).bind(...args),
    DB.prepare(`SELECT COUNT(*) socios, COALESCE(SUM(sellos_totales),0) sellos, COALESCE(SUM(premios),0) premios,
                COALESCE(SUM((sellos_mediodia >= ?) + (sellos_noche >= ?) + (sellos_menu >= ?)), 0) listos FROM socios`).bind(SELLOS_PREMIO, SELLOS_PREMIO, SELLOS_PREMIO),
    DB.prepare(`SELECT
                SUM(CASE WHEN tipo='sello' THEN 1 WHEN tipo='quitar' THEN -1 ELSE 0 END) sellos,
                SUM(CASE WHEN tipo='canje' THEN 1 ELSE 0 END) canjes
                FROM movimientos WHERE date(creado) = date('now')`),
    DB.prepare(`SELECT COUNT(*) n FROM socios WHERE creado >= datetime('now','-7 days')`),
  ]);

  const t = tot.results[0] || {};
  const h = hoy.results[0] || {};
  return json({
    objetivo: SELLOS_PREMIO,
    tipos: TIPO_IDS.map((id) => ({ id, nombre: TIPOS[id].nombre, premio: TIPOS[id].premio })),
    stats: {
      socios: t.socios || 0,
      nuevosSemana: semana.results[0]?.n || 0,
      sellosTotales: t.sellos || 0,
      sellosHoy: Math.max(0, h.sellos || 0),
      premiosCanjeados: t.premios || 0,
      canjesHoy: h.canjes || 0,
      premiosPendientes: t.listos || 0,
    },
    socios: lista.results,
  });
});
