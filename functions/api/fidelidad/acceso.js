// POST /api/fidelidad/acceso
//   {email}          → envía un código de 6 cifras al email del socio (válido 10 min)
//   {email, codigo}  → si el código es correcto, devuelve el token de la tarjeta
// Envío de emails con Resend (variables RESEND_API_KEY y, opcional, EMAIL_FROM).
import { json, db, handle, body, HttpError } from './_lib.js';

const MINUTOS_VALIDEZ = 10;
const MAX_INTENTOS = 5;
const MAX_CODIGOS_HORA = 3;
const GENERICO = 'Si ese email tiene una tarjeta Hanaki, te llegará un código en un minuto (mira también en spam). Si no llega, es que la tarjeta está con otro email: pide al personal que te la reenvíe o crea una nueva.';

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha = async (s) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));

async function tabla(DB) {
  // Se crea sola la primera vez (no hace falta tocar la base de datos a mano)
  await DB.prepare(`CREATE TABLE IF NOT EXISTS accesos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    socio_id INTEGER NOT NULL,
    codigo_hash TEXT NOT NULL,
    expira TEXT NOT NULL,
    intentos INTEGER NOT NULL DEFAULT 0,
    usado INTEGER NOT NULL DEFAULT 0,
    creado TEXT NOT NULL DEFAULT (datetime('now')))`).run();
}

async function enviarEmail(env, para, nombre, codigo, idem) {
  if (!env.RESEND_API_KEY) throw new HttpError(500, 'El envío de emails aún no está configurado (falta RESEND_API_KEY).');
  const html = `<!doctype html><html><body style="margin:0;background:#0A0A0A;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:460px;margin:0 auto;padding:36px 24px;color:#BDB7AE">
    <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:.3em;color:#F2EEE8">HANAKI</div>
    <div style="font-size:11px;letter-spacing:.26em;color:#E0452E;margin-top:4px">TARJETA DE PUNTOS</div>
    <p style="font-size:15px;line-height:1.6;margin:28px 0 14px">Hola ${nombre.replace(/[<>&"]/g, '')}, este es tu código para abrir tu tarjeta:</p>
    <div style="font-family:Georgia,serif;font-size:40px;letter-spacing:.3em;color:#F2EEE8;background:#141414;border:1px solid #6b5a3a;padding:18px 0;text-align:center">${codigo}</div>
    <p style="font-size:13px;line-height:1.6;margin:18px 0 0;color:#8F887E">Caduca en ${MINUTOS_VALIDEZ} minutos. Si no lo has pedido tú, ignora este email.</p>
    <p style="font-size:12px;color:#6B6B6B;margin-top:32px">Hanaki Sushi · Carrer de Joan Güell, 212 · Barcelona</p>
  </div></body></html>`;
  const enviar = () => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'idempotency-key': idem },
    body: JSON.stringify({
      from: env.EMAIL_FROM || 'Hanaki Sushi <tarjeta@hanakisushi.com>',
      to: [para],
      subject: `${codigo} es tu código de Hanaki`,
      html,
      text: `Hola ${nombre}, tu código para abrir tu tarjeta Hanaki es ${codigo}. Caduca en ${MINUTOS_VALIDEZ} minutos.`,
    }),
  });
  // Un reintento solo si falla la red, Resend da 5xx o pide esperar (429); la idempotency-key evita duplicados
  let r;
  try { r = await enviar(); } catch { r = null; }
  if (!r || r.status >= 500 || r.status === 429) { await new Promise((ok) => setTimeout(ok, 1200)); r = await enviar(); }
  if (!r.ok) {
    console.error('Resend', r.status, await r.text());
    throw new HttpError(502, 'No se pudo enviar el email. Inténtalo en unos minutos.');
  }
}

export const onRequestPost = handle(async ({ request, env }) => {
  const DB = db(env);
  const d = await body(request);
  const email = String(d.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'Escribe un email válido.');
  await tabla(DB);

  const socio = await DB.prepare('SELECT id, token, nombre, email FROM socios WHERE lower(trim(email)) = ? ORDER BY id DESC LIMIT 1').bind(email).first();

  // Paso 2: comprobar el código
  if (d.codigo != null) {
    const codigo = String(d.codigo).replace(/\D/g, '');
    if (!socio || codigo.length !== 6) throw new HttpError(400, 'Código incorrecto.');
    const acc = await DB.prepare(`SELECT * FROM accesos WHERE socio_id = ? AND usado = 0 AND expira > datetime('now') ORDER BY id DESC LIMIT 1`).bind(socio.id).first();
    if (!acc) throw new HttpError(400, 'El código ha caducado. Pide uno nuevo.');
    if (acc.intentos >= MAX_INTENTOS) throw new HttpError(429, 'Demasiados intentos. Pide un código nuevo.');
    if ((await sha(socio.id + ':' + codigo)) !== acc.codigo_hash) {
      await DB.prepare('UPDATE accesos SET intentos = intentos + 1 WHERE id = ?').bind(acc.id).run();
      throw new HttpError(400, `Código incorrecto. Te quedan ${MAX_INTENTOS - acc.intentos - 1} intentos.`);
    }
    await DB.prepare('UPDATE accesos SET usado = 1 WHERE id = ?').bind(acc.id).run();
    return json({ token: socio.token });
  }

  // Paso 1: enviar el código (la respuesta es la misma exista o no el email)
  if (socio) {
    const { n } = await DB.prepare(`SELECT COUNT(*) n FROM accesos WHERE socio_id = ? AND creado > datetime('now','-1 hour')`).bind(socio.id).first();
    if (n >= MAX_CODIGOS_HORA) throw new HttpError(429, 'Ya te hemos enviado varios códigos. Espera un rato o pide ayuda al personal.');
    const codigo = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
    const ins = await DB.prepare(`INSERT INTO accesos (socio_id, codigo_hash, expira) VALUES (?, ?, datetime('now', '+${MINUTOS_VALIDEZ} minutes'))`)
      .bind(socio.id, await sha(socio.id + ':' + codigo)).run();
    await enviarEmail(env, socio.email.trim(), socio.nombre, codigo, `hanaki-acceso-${ins.meta.last_row_id}`);
  } else {
    await new Promise((r) => setTimeout(r, 700));
  }
  return json({ ok: true, mensaje: GENERICO });
});
