// Protege todo /api/fidelidad/admin/* salvo el login
import { json, handle, sesionValida } from '../_lib.js';

export const onRequest = handle(async ({ request, env, next }) => {
  const ruta = new URL(request.url).pathname;
  if (ruta.endsWith('/admin/login')) return next();
  if (!(await sesionValida(request, env))) return json({ error: 'Sesión caducada. Vuelve a entrar.' }, 401);
  return next();
});
