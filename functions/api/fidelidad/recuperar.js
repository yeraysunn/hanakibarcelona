// POST /api/fidelidad/recuperar {telefono, nombre} — abrir la tarjeta propia desde otro móvil
import { json, db, handle, body, HttpError, normalizarTelefono } from './_lib.js';

const limpiar = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().split(/\s+/)[0] || '';

export const onRequestPost = handle(async ({ request, env }) => {
  const d = await body(request);
  const telefono = normalizarTelefono(d.telefono);
  const nombre = limpiar(d.nombre);
  if (!telefono || nombre.length < 2) throw new HttpError(400, 'Escribe tu teléfono y tu nombre.');

  const socio = await db(env).prepare('SELECT token, nombre FROM socios WHERE telefono = ?').bind(telefono).first();
  if (!socio || limpiar(socio.nombre) !== nombre) {
    await new Promise((r) => setTimeout(r, 900)); // frena a quien pruebe teléfonos al azar
    throw new HttpError(404, 'No encontramos ninguna tarjeta con esos datos. Usa el mismo nombre y teléfono con los que te registraste.');
  }
  return json({ token: socio.token });
});
