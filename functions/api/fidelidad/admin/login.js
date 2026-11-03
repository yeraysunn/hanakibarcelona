// POST /api/fidelidad/admin/login  {password}   ·   DELETE = cerrar sesión
import { json, handle, body, HttpError, passwordCorrecta, cookieSesion, cookieCerrar } from '../_lib.js';

export const onRequestPost = handle(async ({ request, env }) => {
  const { password } = await body(request);
  if (!(await passwordCorrecta(env, password))) {
    await new Promise((r) => setTimeout(r, 800)); // frena intentos a lo bruto
    throw new HttpError(401, 'Contraseña incorrecta.');
  }
  return json({ ok: true }, 200, { 'set-cookie': await cookieSesion(env) });
});

export const onRequestDelete = () => json({ ok: true }, 200, { 'set-cookie': cookieCerrar });
