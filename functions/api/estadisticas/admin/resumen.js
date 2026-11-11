// GET /api/estadisticas/admin/resumen?dias=7|30|90 — visitas de la web, de dónde vienen y qué acaba en reserva
import { json, db, handle } from '../../fidelidad/_lib.js';
import { tablaVisitas } from '../../_estadisticas.js';
import { hoyMadrid } from '../../reservas/_comun.js';

const restar = (f, n) => new Date(Date.parse(f) - n * 864e5).toISOString().slice(0, 10);

export const onRequestGet = handle(async ({ request, env }) => {
  const DB = db(env);
  await tablaVisitas(DB);
  const dias = [7, 30, 90].includes(Number(new URL(request.url).searchParams.get('dias'))) ? Number(new URL(request.url).searchParams.get('dias')) : 30;
  const hasta = hoyMadrid(), desde = restar(hasta, dias - 1);
  const antDesde = restar(desde, dias), antHasta = restar(desde, 1);

  // Consultas que pueden fallar si una tabla aún no existe (p. ej. nadie ha reservado todavía)
  const seguro = async (stmt, def) => { try { return await stmt; } catch { return def; } };
  const V = (sql, ...b) => DB.prepare(sql).bind(...b);

  const [porDia, paginas, origenes, dispositivos, eventos, horas, anterior] = (await DB.batch([
    V(`SELECT dia, COUNT(*) vistas, COUNT(DISTINCT visitante) visitantes FROM visitas WHERE tipo = 'vista' AND dia BETWEEN ? AND ? GROUP BY dia ORDER BY dia`, desde, hasta),
    V(`SELECT ruta, COUNT(*) n FROM visitas WHERE tipo = 'vista' AND dia BETWEEN ? AND ? GROUP BY ruta ORDER BY n DESC LIMIT 8`, desde, hasta),
    V(`SELECT origen, COUNT(*) n FROM visitas WHERE tipo = 'vista' AND origen != 'interno' AND dia BETWEEN ? AND ? GROUP BY origen ORDER BY n DESC LIMIT 8`, desde, hasta),
    V(`SELECT dispositivo, COUNT(DISTINCT dia || visitante) n FROM visitas WHERE tipo = 'vista' AND dia BETWEEN ? AND ? GROUP BY dispositivo ORDER BY n DESC`, desde, hasta),
    V(`SELECT tipo, COUNT(*) n FROM visitas WHERE tipo != 'vista' AND dia BETWEEN ? AND ? GROUP BY tipo ORDER BY n DESC`, desde, hasta),
    V(`SELECT hora, COUNT(*) n FROM visitas WHERE tipo = 'vista' AND dia BETWEEN ? AND ? GROUP BY hora ORDER BY hora`, desde, hasta),
    V(`SELECT COUNT(*) vistas, COUNT(DISTINCT dia || visitante) visitantes FROM visitas WHERE tipo = 'vista' AND dia BETWEEN ? AND ?`, antDesde, antHasta),
  ])).map((r) => r.results);

  const rango = (col) => `date(${col}, '+1 hour') BETWEEN ? AND ?`; // creado está en UTC; aproximación a la hora de Barcelona
  const reservas = await seguro(V(`SELECT COUNT(*) n, COALESCE(SUM(adultos + ninos + bebes), 0) personas,
      SUM(estado = 'llego') llegaron, SUM(estado = 'no_vino') no_vinieron, SUM(estado = 'cancelada') canceladas
      FROM reservas WHERE ${rango('creado')}`, desde, hasta).first(), null);
  const reservasAnt = await seguro(V(`SELECT COUNT(*) n FROM reservas WHERE ${rango('creado')}`, antDesde, antHasta).first(), null);
  const socios = await seguro(V(`SELECT COUNT(*) n FROM socios WHERE ${rango('creado')}`, desde, hasta).first(), null);
  const sellos = await seguro(V(`SELECT COUNT(*) n FROM movimientos WHERE tipo IN ('sello', 'compra') AND ${rango('creado')}`, desde, hasta).first(), null);
  const resenas = await seguro(V(`SELECT COUNT(*) n FROM resenas WHERE enviado IS NOT NULL AND ${rango('enviado')}`, desde, hasta).first(), null);

  const vistas = porDia.reduce((s, d) => s + d.vistas, 0);
  const visitantes = porDia.reduce((s, d) => s + d.visitantes, 0);
  return json({
    dias, desde, hasta,
    totales: { vistas, visitantes, reservas: reservas?.n || 0, personas: reservas?.personas || 0, socios: socios?.n || 0, sellos: sellos?.n || 0, resenas: resenas?.n || 0 },
    anterior: { vistas: anterior[0]?.vistas || 0, visitantes: anterior[0]?.visitantes || 0, reservas: reservasAnt?.n || 0 },
    reservas: { llegaron: reservas?.llegaron || 0, no_vinieron: reservas?.no_vinieron || 0, canceladas: reservas?.canceladas || 0 },
    porDia, paginas, origenes, dispositivos, eventos, horas,
  });
});
