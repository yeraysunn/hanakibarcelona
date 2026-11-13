// POST /api/promos/admin/vista  {…mensaje} — devuelve el email tal y como lo verá un socio de ejemplo
import { json, handle, body } from '../../fidelidad/_lib.js';
import { limpiar, montar } from '../_promos.js';

export const onRequestPost = handle(async ({ request }) => {
  const m = limpiar(await body(request));
  const base = new URL(request.url).origin;
  const e = montar(m, { nombre: 'Marta García', puntos: 14000 }, base, '#');
  return json({ asunto: e.asunto, html: e.html });
});
