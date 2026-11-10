// GET  /api/carta/admin/cambios — todos los cambios guardados
// POST /api/carta/admin/cambios {clave, datos} — guarda (o borra si datos está vacío) los cambios de un plato o bebida
import { json, db, handle, body, HttpError } from '../../fidelidad/_lib.js';
import { cambios, tablaCarta } from '../_carta.js';
import { hoyMadrid } from '../../reservas/_comun.js';

export const onRequestGet = handle(async ({ env }) => json({ hoy: hoyMadrid(), cambios: await cambios(db(env)) }));

const texto = (v, max) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);

export const onRequestPost = handle(async ({ request, env }) => {
  const DB = db(env);
  await tablaCarta(DB);
  const { clave, datos = {} } = await body(request);
  if (!/^(p\|.{1,80}|b\|.{1,60}\|.{1,80})$/.test(String(clave || ''))) throw new HttpError(400, 'Plato no válido.');

  const d = {};
  if (datos.nombre != null && texto(datos.nombre, 60)) d.nombre = texto(datos.nombre, 60);
  if (datos.desc != null) d.desc = texto(datos.desc, 120);          // '' = sin descripción
  if (datos.precio != null && String(datos.precio).trim() !== '') {
    const p = String(datos.precio).trim().replace('.', ',');
    if (!/^\d{1,3}(,\d{1,2})?$/.test(p)) throw new HttpError(400, 'Precio no válido. Escríbelo así: 4,50');
    const [e, c = ''] = p.split(',');
    d.precio = e + ',' + c.padEnd(2, '0');
  }
  if (datos.sinPrecio) d.precio = '';                                 // quitar el precio aparte (pasa a incluido)
  if (datos.oculto) d.oculto = true;
  if (datos.agotado) d.agotado = hoyMadrid();

  if (!Object.keys(d).length) {
    await DB.prepare('DELETE FROM carta WHERE clave = ?').bind(clave).run();
  } else {
    await DB.prepare(`INSERT INTO carta (clave, datos, actualizado) VALUES (?, ?, datetime('now'))
      ON CONFLICT(clave) DO UPDATE SET datos = excluded.datos, actualizado = excluded.actualizado`).bind(clave, JSON.stringify(d)).run();
  }
  return json({ ok: true, clave, datos: d });
});
