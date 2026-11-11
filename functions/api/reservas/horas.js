// GET /api/reservas/horas?fecha=YYYY-MM-DD — horas que el restaurante ha cerrado ese día (público)
import { json, db, handle, tabla, validarFecha, horasCerradas } from './_comun.js';

export const onRequestGet = handle(async ({ request, env }) => {
  const DB = db(env);
  await tabla(DB);
  const fecha = new URL(request.url).searchParams.get('fecha') || '';
  validarFecha(fecha);
  return json({ fecha, cerradas: await horasCerradas(DB, fecha) });
});
