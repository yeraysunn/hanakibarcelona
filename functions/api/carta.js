// GET /api/carta — cambios de la carta para la página pública (/carta): platos agotados hoy, ocultos, precios y textos
import { json, db, handle } from './fidelidad/_lib.js';
import { cambios } from './carta/_carta.js';
import { hoyMadrid } from './reservas/_comun.js';

export const onRequestGet = handle(async ({ env }) => {
  const hoy = hoyMadrid();
  const out = {};
  for (const { clave, datos } of await cambios(db(env))) {
    const d = { ...datos };
    if (d.agotado) { if (d.agotado === hoy) d.agotado = true; else delete d.agotado; } // «agotado» se quita solo al día siguiente
    if (Object.keys(d).length) out[clave] = d;
  }
  return json({ hoy, cambios: out }, 200, { 'cache-control': 'public, max-age=30' });
});
