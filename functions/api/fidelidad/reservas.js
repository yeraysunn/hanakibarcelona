// GET /api/fidelidad/reservas?t=TOKEN — reservas del socio (por su teléfono o email) y sus datos para rellenar el formulario.
// Salen también las reservas hechas antes de crear la tarjeta, si usó el mismo teléfono o email.
import { json, dbListo, handle, HttpError } from './_lib.js';
import { tabla, hoyMadrid } from '../reservas/_comun.js';

const DIAS_HISTORIAL = 120;

export const onRequestGet = handle(async ({ request, env }) => {
  const t = new URL(request.url).searchParams.get('t') || '';
  if (!/^[a-f0-9]{32}$/.test(t)) throw new HttpError(404, 'Tarjeta no encontrada.');
  const DB = await dbListo(env);
  const socio = await DB.prepare('SELECT nombre, telefono, email FROM socios WHERE token = ?').bind(t).first();
  if (!socio) throw new HttpError(404, 'Tarjeta no encontrada.');
  await tabla(DB);

  const hoy = hoyMadrid();
  const desde = new Date(Date.parse(hoy) - DIAS_HISTORIAL * 864e5).toISOString().slice(0, 10);
  const { results } = await DB.prepare(`SELECT id, fecha, hora, adultos, ninos, bebes, estado FROM reservas
    WHERE (telefono = ? OR (? IS NOT NULL AND email = ?)) AND fecha >= ?
    ORDER BY fecha DESC, hora DESC LIMIT 30`).bind(socio.telefono, socio.email, socio.email, desde).all();

  const proximas = results.filter((r) => r.fecha >= hoy && ['pendiente', 'confirmada'].includes(r.estado)).reverse();
  const anteriores = results.filter((r) => !proximas.includes(r)).slice(0, 10);
  return json({ hoy, socio, proximas, anteriores });
});
