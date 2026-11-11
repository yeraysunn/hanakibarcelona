// POST /api/fidelidad/admin/accion  {accion, id|token|codigo, …}
//   compra  {importe, forzar?}   suma puntos según lo que ha consumido el cliente (regla en _lib.js)
//   canjear {premio_id, puntos?} resta los puntos del premio de la tienda (si el premio es de precio variable, los que se indiquen)
//   ajuste  {puntos, nota?}      corrección manual (+ o −), p. ej. para deshacer un error
import { json, dbListo, handle, body, HttpError, buscarSocio, puntosDe, MINUTOS_ENTRE_COMPRAS, IMPORTE_MAXIMO, TRAMO_EUROS } from '../_lib.js';
import { programarResena } from '../../_resenas.js';

const fmt = (n) => String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const onRequestPost = handle(async ({ request, env, waitUntil }) => {
  const DB = await dbListo(env);
  const d = await body(request);
  const socio = await buscarSocio(DB, d);
  if (!socio) throw new HttpError(404, 'No se encuentra esa tarjeta.');
  const saldo = socio.puntos || 0;

  let update, mov, extra = {};
  if (d.accion === 'compra') {
    const importe = Math.round(Number(String(d.importe).replace(',', '.')) * 100) / 100;
    if (!Number.isFinite(importe) || importe <= 0) throw new HttpError(400, 'Escribe el importe de la cuenta.');
    if (importe > IMPORTE_MAXIMO) throw new HttpError(400, `El importe máximo por cuenta es ${fmt(IMPORTE_MAXIMO)} €.`);
    const puntos = puntosDe(importe);
    if (puntos <= 0) throw new HttpError(400, `Con menos de ${TRAMO_EUROS} € no se suman puntos.`);
    if (!d.forzar && socio.ultimo_sello) {
      const min = (Date.now() - Date.parse(socio.ultimo_sello.replace(' ', 'T') + 'Z')) / 60000;
      if (min < MINUTOS_ENTRE_COMPRAS) {
        return json({ aviso: `A ${socio.nombre} ya se le sumaron puntos hace ${Math.max(1, Math.round(min))} min. ¿Sumar otra vez igualmente?`, socio }, 409);
      }
    }
    update = DB.prepare(`UPDATE socios SET puntos = COALESCE(puntos, 0) + ?, puntos_totales = puntos_totales + ?, ultimo_sello = datetime('now') WHERE id = ? RETURNING *`).bind(puntos, puntos, socio.id);
    mov = DB.prepare(`INSERT INTO movimientos (socio_id, tipo, puntos, importe) VALUES (?, 'compra', ?, ?)`).bind(socio.id, puntos, importe);
    extra = { puntos, importe };
  } else if (d.accion === 'canjear') {
    const premio = await DB.prepare('SELECT * FROM premios WHERE id = ?').bind(Number(d.premio_id)).first();
    if (!premio || !premio.activo) throw new HttpError(404, 'Ese premio ya no está en la tienda.');
    let coste = premio.puntos;
    if (premio.variable) { // precio variable: lo escribe el personal al canjear (p. ej. el que marca cada gato)
      coste = Math.trunc(Number(String(d.puntos ?? '').replace(/[.\s]/g, '')));
      if (!Number.isFinite(coste) || coste <= 0 || coste > 10000000) throw new HttpError(400, `Escribe cuántos puntos cuesta «${premio.nombre}».`);
    }
    if (coste == null) throw new HttpError(409, 'Ese premio todavía no tiene precio en puntos.');
    if (saldo < coste) throw new HttpError(409, `A ${socio.nombre} le faltan ${fmt(coste - saldo)} puntos para «${premio.nombre}».`);
    update = DB.prepare('UPDATE socios SET puntos = puntos - ?, premios = premios + 1 WHERE id = ? AND puntos >= ? RETURNING *').bind(coste, socio.id, coste);
    mov = DB.prepare(`INSERT INTO movimientos (socio_id, tipo, puntos, premio_id, nota) VALUES (?, 'canje', ?, ?, ?)`).bind(socio.id, -coste, premio.id, premio.nombre);
    extra = { puntos: -coste, premio: premio.nombre };
  } else if (d.accion === 'ajuste') {
    const puntos = Math.trunc(Number(d.puntos));
    if (!Number.isFinite(puntos) || puntos === 0) throw new HttpError(400, 'Escribe cuántos puntos sumar o restar.');
    if (Math.abs(puntos) > 1000000) throw new HttpError(400, 'Demasiados puntos de una vez.');
    if (saldo + puntos < 0) throw new HttpError(409, `${socio.nombre} solo tiene ${fmt(saldo)} puntos.`);
    const nota = String(d.nota || '').trim().slice(0, 120) || 'Corrección manual';
    update = DB.prepare('UPDATE socios SET puntos = COALESCE(puntos, 0) + ?, puntos_totales = puntos_totales + MAX(?, 0) WHERE id = ? AND COALESCE(puntos, 0) + ? >= 0 RETURNING *').bind(puntos, puntos, socio.id, puntos);
    mov = DB.prepare(`INSERT INTO movimientos (socio_id, tipo, puntos, nota) VALUES (?, 'ajuste', ?, ?)`).bind(socio.id, puntos, nota);
    extra = { puntos };
  } else {
    throw new HttpError(400, 'Acción no válida.');
  }

  const [res] = await DB.batch([update, mov]);
  const actualizado = res.results[0];
  if (!actualizado) throw new HttpError(409, 'La tarjeta ha cambiado. Recarga e inténtalo otra vez.');
  // Ha comido hoy: al día siguiente le pedimos una reseña en Google (máx. una vez cada 90 días por email)
  if (d.accion === 'compra' && actualizado.email) {
    waitUntil(programarResena(env, DB, { email: actualizado.email, nombre: actualizado.nombre, origen: 'tarjeta', base: new URL(request.url).origin }));
  }
  return json({ ok: true, accion: d.accion, ...extra, socio: actualizado });
});
