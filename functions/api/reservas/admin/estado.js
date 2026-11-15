// POST /api/reservas/admin/estado {id, estado} — confirmar, cancelar, llegó, no vino
import { json, db, handle, body, tabla } from '../_comun.js';
import { cambiarEstado } from '../_estado.js';

export const onRequestPost = handle(async ({ request, env, waitUntil }) => {
  const DB = db(env);
  await tabla(DB);
  const { id, estado } = await body(request);
  const res = await cambiarEstado({ env, DB, base: new URL(request.url).origin, waitUntil }, id, estado);
  return json({ ok: true, reserva: res.reserva, email: res.email });
});
