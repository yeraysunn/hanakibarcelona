// POST /api/promos/admin/enviar
//   {prueba: 'email', …mensaje}           → un email de prueba a esa dirección (no cuenta como envío)
//   {segmento, …mensaje, confirmar: true} → crea la promoción y la envía a los socios del grupo
//   {continuar: id}                       → sigue una promoción que se quedó a medias (solo a quien no la recibió)
import { json, dbListo, handle, body, HttpError, enviarEmail } from '../../fidelidad/_lib.js';
import { LOTE, SEGMENTOS, tablas, limpiar, montar, destinatarios, enlaceBaja, enviarLote } from '../_promos.js';

const DE = (env) => env.EMAIL_FROM_PROMOS || 'Hanaki Sushi <hola@hanakisushi.com>';

export const onRequestPost = handle(async ({ request, env }) => {
  const d = await body(request);
  const DB = await dbListo(env);
  await tablas(DB);
  const base = new URL(request.url).origin;

  // --- prueba ---
  if (d.prueba) {
    const para = String(d.prueba).trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(para)) throw new HttpError(400, 'Escribe un email válido para la prueba.');
    const m = limpiar(d);
    if (!m.texto) throw new HttpError(400, 'El mensaje está vacío.');
    const e = montar(m, { nombre: 'Marta García', puntos: 14000 }, base, base + '/');
    if (!env.RESEND_API_KEY) throw new HttpError(500, 'Falta RESEND_API_KEY: no se pueden enviar emails.');
    await enviarEmail(env, { para, asunto: '[PRUEBA] ' + e.asunto, html: e.html, texto: e.texto, de: DE(env), responder: env.EMAIL_RESPUESTAS || undefined });
    return json({ ok: true, prueba: para });
  }

  // --- nueva promoción o continuar una ---
  let promo;
  if (d.continuar) {
    promo = await DB.prepare('SELECT * FROM promos WHERE id = ?').bind(Number(d.continuar)).first();
    if (!promo) throw new HttpError(404, 'No se encuentra esa promoción.');
  } else {
    if (!d.confirmar) throw new HttpError(400, 'Falta confirmar el envío.');
    const m = limpiar(d);
    if (!m.asunto) throw new HttpError(400, 'Escribe el asunto del email.');
    if (!m.texto) throw new HttpError(400, 'El mensaje está vacío.');
    const segmento = SEGMENTOS[d.segmento] ? d.segmento : 'todos';
    // Evita mandar dos veces lo mismo por un doble clic
    const repe = await DB.prepare(`SELECT id FROM promos WHERE asunto = ? AND segmento = ? AND creado > datetime('now', '-15 minutes')`).bind(m.asunto, segmento).first();
    if (repe && !d.forzar) throw new HttpError(409, 'Esta promoción ya se ha enviado hace unos minutos. Si no ha llegado a todos, usa «Continuar envío» en el historial.');
    if (!(await destinatarios(DB, segmento)).length) throw new HttpError(400, 'No hay ningún socio en ese grupo que haya aceptado recibir promociones.');
    promo = await DB.prepare('INSERT INTO promos (tipo, segmento, asunto, datos) VALUES (?, ?, ?, ?) RETURNING *').bind(m.tipo, segmento, m.asunto, JSON.stringify(m)).first();
  }
  const m = JSON.parse(promo.datos);

  // Socios del grupo que aún no la han recibido (y siguen aceptando promociones)
  const todos = await destinatarios(DB, promo.segmento);
  const { results: ya } = await DB.prepare('SELECT email FROM promo_envios WHERE promo_id = ?').bind(promo.id).all();
  const hechos = new Set(ya.map((r) => r.email));
  const pendientes = todos.filter((s) => !hechos.has(s.email));
  if (!d.continuar) await DB.prepare('UPDATE promos SET destinatarios = ? WHERE id = ?').bind(todos.length, promo.id).run();

  let enviados = 0, error = null;
  for (let i = 0; i < pendientes.length; i += LOTE) {
    const lote = pendientes.slice(i, i + LOTE);
    const emails = [];
    for (const s of lote) {
      const baja = await enlaceBaja(env, base, s.email);
      const e = montar(m, s, base, baja);
      emails.push({
        from: DE(env), to: [s.email], subject: e.asunto, html: e.html, text: e.texto,
        ...(env.EMAIL_RESPUESTAS ? { reply_to: env.EMAIL_RESPUESTAS } : {}),
        headers: { 'List-Unsubscribe': `<${baja}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      });
    }
    try {
      await enviarLote(env, emails, `hanaki-promo-${promo.id}-${lote[0].email}-${lote.length}`);
    } catch (e) { error = e; break; }
    await DB.batch(lote.map((s) => DB.prepare('INSERT OR IGNORE INTO promo_envios (promo_id, email, socio_id) VALUES (?, ?, ?)').bind(promo.id, s.email, s.id)));
    enviados += lote.length;
  }

  const total = (await DB.prepare('SELECT COUNT(*) n FROM promo_envios WHERE promo_id = ?').bind(promo.id).first()).n;
  const faltan = pendientes.length - enviados;
  await DB.prepare(`UPDATE promos SET enviados = ?, errores = ?, terminado = CASE WHEN ? = 0 THEN datetime('now') ELSE NULL END WHERE id = ?`).bind(total, faltan, faltan, promo.id).run();
  if (error && !enviados) throw error;
  return json({ ok: !error, id: promo.id, enviados, total, faltan, aviso: error ? error.message : null });
});
