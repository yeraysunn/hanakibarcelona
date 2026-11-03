// POST /api/fidelidad/admin/accion  {accion: 'sello'|'quitar'|'canjear', tipo: 'mediodia'|'noche'|'menu', id|token|codigo, forzar?}
// Cada tipo (buffet de mediodía, buffet de noche, menú) tiene su propio contador de sellos y su propio premio.
import { json, dbListo, handle, body, HttpError, buscarSocio, SELLOS_PREMIO, MINUTOS_ENTRE_SELLOS, TIPOS, tipoDe } from '../_lib.js';

export const onRequestPost = handle(async ({ request, env }) => {
  const DB = await dbListo(env);
  const d = await body(request);
  const socio = await buscarSocio(DB, d);
  if (!socio) throw new HttpError(404, 'No se encuentra esa tarjeta.');

  const tipo = tipoDe(d.tipo);
  const col = 'sellos_' + tipo, colPremios = 'premios_' + tipo; // nombres de columna seguros: tipoDe solo admite los ids de TIPOS
  const n = socio[col] || 0;
  const premio = TIPOS[tipo].premio;

  let update;
  if (d.accion === 'sello') {
    if (n >= SELLOS_PREMIO) throw new HttpError(409, `${socio.nombre} ya tiene pendiente: ${premio}. Canjéalo primero.`);
    if (!d.forzar && socio.ultimo_sello) {
      const min = (Date.now() - Date.parse(socio.ultimo_sello.replace(' ', 'T') + 'Z')) / 60000;
      if (min < MINUTOS_ENTRE_SELLOS) {
        return json({ aviso: `A ${socio.nombre} ya se le puso un sello hace ${Math.max(1, Math.round(min))} min. ¿Poner otro igualmente?`, socio }, 409);
      }
    }
    update = DB.prepare(`UPDATE socios SET ${col} = ${col} + 1, sellos_totales = sellos_totales + 1, ultimo_sello = datetime('now') WHERE id = ? AND ${col} < ? RETURNING *`).bind(socio.id, SELLOS_PREMIO);
  } else if (d.accion === 'quitar') {
    if (n <= 0) throw new HttpError(409, 'Esta tarjeta no tiene sellos de ese tipo que quitar.');
    update = DB.prepare(`UPDATE socios SET ${col} = ${col} - 1, sellos_totales = MAX(sellos_totales - 1, 0) WHERE id = ? AND ${col} > 0 RETURNING *`).bind(socio.id);
  } else if (d.accion === 'canjear') {
    if (n < SELLOS_PREMIO) throw new HttpError(409, `Le faltan ${SELLOS_PREMIO - n} sellos para el premio.`);
    update = DB.prepare(`UPDATE socios SET ${col} = 0, ${colPremios} = ${colPremios} + 1, premios = premios + 1 WHERE id = ? AND ${col} >= ? RETURNING *`).bind(socio.id, SELLOS_PREMIO);
  } else {
    throw new HttpError(400, 'Acción no válida.');
  }

  const movimiento = { sello: 'sello', quitar: 'quitar', canjear: 'canje' }[d.accion];
  const [res] = await DB.batch([update, DB.prepare('INSERT INTO movimientos (socio_id, tipo, tipo_sello) VALUES (?, ?, ?)').bind(socio.id, movimiento, tipo)]);
  const actualizado = res.results[0];
  if (!actualizado) throw new HttpError(409, 'La tarjeta ha cambiado. Recarga e inténtalo otra vez.');
  return json({ ok: true, tipo, socio: actualizado });
});
