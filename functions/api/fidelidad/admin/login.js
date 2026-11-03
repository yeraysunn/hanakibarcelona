// POST /api/fidelidad/admin/login  {password}   ·   GET = comprobar sesión   ·   DELETE = cerrar sesión
import { json, handle, body, HttpError, passwordCorrecta, cookieSesion, cookieCerrar, sesionValida } from '../_lib.js';

// GET = ¿hay sesión abierta? (la usa la pantalla de bienvenida /admin/)
export const onRequestGet = handle(async ({ request, env }) => json({ ok: await sesionValida(request, env) }));

export const onRequestPost = handle(async ({ request, env }) => {
  const { password } = await body(request);
  if (!(await passwordCorrecta(env, password))) {
    await new Promise((r) => setTimeout(r, 800)); // frena intentos a lo bruto
    throw new HttpError(401, 'Contraseña incorrecta.');
  }
  return json({ ok: true }, 200, { 'set-cookie': await cookieSesion(env) });
});

export const onRequestDelete = () => json({ ok: true }, 200, { 'set-cookie': cookieCerrar });
