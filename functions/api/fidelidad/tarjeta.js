// GET /api/fidelidad/tarjeta?t=TOKEN — estado de la tarjeta del cliente
import { json, db, handle, HttpError, tarjetaPublica } from './_lib.js';

export const onRequestGet = handle(async ({ request, env }) => {
  const t = new URL(request.url).searchParams.get('t') || '';
  if (!/^[a-f0-9]{32}$/.test(t)) throw new HttpError(404, 'Tarjeta no encontrada.');
  const socio = await db(env).prepare('SELECT * FROM socios WHERE token = ?').bind(t).first();
  if (!socio) throw new HttpError(404, 'Tarjeta no encontrada.');
  return json({ tarjeta: tarjetaPublica(socio) });
});
