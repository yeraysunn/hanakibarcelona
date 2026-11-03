// POST /api/fidelidad/admin/accion  {accion: 'sello'|'quitar'|'canjear', id|token|codigo, forzar?}
import { json, db, handle, body, HttpError, buscarSocio, SELLOS_PREMIO, MINUTOS_ENTRE_SELLOS } from '../_lib.js';

export const onRequestPost = handle(async ({ request, env }) => {
  const DB = db(env);
  const d = await body(request);
  const socio = await buscarSocio(DB, d);
  if (!socio) throw new HttpError(404, 'No se encuentra esa tarjeta.');

  let update, tipo;
  if (d.accion === 'sello') {
    if (socio.sellos >= SELLOS_PREMIO) throw new HttpError(409, `${socio.nombre} ya tiene el buffet gratis pendiente. Canjéalo primero.`);
    if (!d.forzar && socio.ultimo_sello) {
      const min = (Date.now() - Date.parse(socio.ultimo_sello.replace(' ', 'T') + 'Z')) / 60000;
      if (min < MINUTOS_ENTRE_SELLOS) {
        return json({ aviso: `A ${socio.nombre} ya se le puso un sello hace ${Math.max(1, Math.round(min))} min. ¿Poner otro igualmente?`, socio }, 409);
      }
    }
    tipo = 'sello';
    update = DB.prepare(`UPDATE socios SET sellos = sellos + 1, sellos_totales = sellos_totales + 1, ultimo_sello = datetime('now') WHERE id = ? AND sellos < ? RETURNING *`).bind(socio.id, SELLOS_PREMIO);
  } else if (d.accion === 'quitar') {
    if (socio.sellos <= 0) throw new HttpError(409, 'Esta tarjeta no tiene sellos que quitar.');
    tipo = 'quitar';
    update = DB.prepare(`UPDATE socios SET sellos = sellos - 1, sellos_totales = MAX(sellos_totales - 1, 0) WHERE id = ? AND sellos > 0 RETURNING *`).bind(socio.id);
  } else if (d.accion === 'canjear') {
    if (socio.sellos < SELLOS_PREMIO) throw new HttpError(409, `Le faltan ${SELLOS_PREMIO - socio.sellos} sellos para el premio.`);
    tipo = 'canje';
    update = DB.prepare(`UPDATE socios SET sellos = 0, premios = premios + 1 WHERE id = ? AND sellos >= ? RETURNING *`).bind(socio.id, SELLOS_PREMIO);
  } else {
    throw new HttpError(400, 'Acción no válida.');
  }

  const [res] = await DB.batch([update, DB.prepare('INSERT INTO movimientos (socio_id, tipo) VALUES (?, ?)').bind(socio.id, tipo)]);
  const actualizado = res.results[0];
  if (!actualizado) throw new HttpError(409, 'La tarjeta ha cambiado. Recarga e inténtalo otra vez.');
  return json({ ok: true, socio: actualizado });
});
