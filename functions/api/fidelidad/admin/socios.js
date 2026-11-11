// GET /api/fidelidad/admin/socios?q=texto — lista de socios + estadísticas + tienda de premios
import { json, dbListo, handle, listaPremios, reglaPuntos } from '../_lib.js';

export const onRequestGet = handle(async ({ request, env }) => {
  const DB = await dbListo(env);
  const q = (new URL(request.url).searchParams.get('q') || '').trim();
  const premios = await listaPremios(DB, true);
  const minimo = Math.min(...premios.filter((p) => p.activo && !p.variable && p.puntos != null).map((p) => p.puntos), Infinity);

  let sql = 'SELECT id, token, codigo, nombre, telefono, email, acepta_promos, COALESCE(puntos, 0) AS puntos, puntos_totales, premios, creado, ultimo_sello FROM socios';
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
    DB.prepare(`SELECT COUNT(*) socios, COALESCE(SUM(puntos), 0) saldo, COALESCE(SUM(premios), 0) premios,
                COALESCE(SUM(COALESCE(puntos, 0) >= ?), 0) listos FROM socios`).bind(Number.isFinite(minimo) ? minimo : 9e15),
    DB.prepare(`SELECT COALESCE(SUM(CASE WHEN tipo = 'compra' THEN puntos ELSE 0 END), 0) puntos,
                COALESCE(SUM(CASE WHEN tipo = 'compra' THEN importe ELSE 0 END), 0) importe,
                SUM(CASE WHEN tipo = 'canje' THEN 1 ELSE 0 END) canjes
                FROM movimientos WHERE date(creado) = date('now')`),
    DB.prepare(`SELECT COUNT(*) n FROM socios WHERE creado >= datetime('now','-7 days')`),
  ]);

  const t = tot.results[0] || {};
  const h = hoy.results[0] || {};
  return json({
    regla: reglaPuntos(),
    premios,
    stats: {
      socios: t.socios || 0,
      nuevosSemana: semana.results[0]?.n || 0,
      puntosHoy: h.puntos || 0,
      importeHoy: h.importe || 0,
      puntosSaldo: t.saldo || 0,
      premiosCanjeados: t.premios || 0,
      canjesHoy: h.canjes || 0,
      puedenCanjear: t.listos || 0,
    },
    socios: lista.results,
  });
});
