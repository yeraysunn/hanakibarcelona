// GET /api/reservas/admin/lista?fecha=YYYY-MM-DD — reservas de un día + resumen
import { json, db, handle, tabla, hoyMadrid, validarFecha, horasCerradas, HORAS } from '../_comun.js';

export const onRequestGet = handle(async ({ request, env }) => {
  const DB = db(env);
  await tabla(DB);
  const fecha = new URL(request.url).searchParams.get('fecha') || hoyMadrid();
  validarFecha(fecha);
  const hoy = hoyMadrid();
  const [lista, pend] = await DB.batch([
    DB.prepare(`SELECT * FROM reservas WHERE fecha = ? ORDER BY hora, id`).bind(fecha),
    DB.prepare(`SELECT fecha, COUNT(*) n FROM reservas WHERE estado = 'pendiente' AND fecha >= ? GROUP BY fecha ORDER BY fecha LIMIT 30`).bind(hoy),
  ]);
  return json({ fecha, hoy, reservas: lista.results, pendientes: pend.results, horas: HORAS, cerradas: await horasCerradas(DB, fecha) });
});
