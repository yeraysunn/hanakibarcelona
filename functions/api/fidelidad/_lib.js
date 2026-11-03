// Utilidades compartidas de la tarjeta de fidelidad (Cloudflare Pages Functions + D1).
// No exporta onRequest, así que no crea ninguna ruta pública.

export const SELLOS_PREMIO = 8;          // sellos necesarios para el buffet gratis
export const MINUTOS_ENTRE_SELLOS = 60;  // aviso si se intenta sellar dos veces seguidas

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function db(env) {
  if (!env.DB) throw new HttpError(500, 'Falta conectar la base de datos (binding DB) en Cloudflare Pages.');
  return env.DB;
}

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function handle(fn) {
  return async (ctx) => {
    try { return await fn(ctx); }
    catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      const msg = String(e && e.message || e);
      if (/no such table/i.test(msg)) return json({ error: 'La base de datos está vacía: ejecuta fidelidad/schema.sql en la consola de D1.' }, 500);
      console.error(e);
      return json({ error: 'Error inesperado. Inténtalo de nuevo.' }, 500);
    }
  };
}

export async function body(request) {
  try { return await request.json(); } catch { throw new HttpError(400, 'Petición no válida.'); }
}

// ---------- tokens y códigos ----------
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export function nuevoToken() {
  return hex(crypto.getRandomValues(new Uint8Array(16)));
}

const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O, 1/I/L
export function nuevoCodigo() {
  const r = crypto.getRandomValues(new Uint8Array(6));
  return [...r].map((b) => ALFABETO[b % ALFABETO.length]).join('');
}

export function normalizarTelefono(t) {
  let s = String(t || '').replace(/[^\d+]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (/^[6789]\d{8}$/.test(s)) s = '+34' + s;          // móvil/fijo español sin prefijo
  if (!/^\+\d{8,15}$/.test(s)) return null;
  return s;
}

// Datos que puede ver el propio cliente en su tarjeta
export function tarjetaPublica(s) {
  return {
    nombre: s.nombre,
    codigo: s.codigo,
    sellos: s.sellos,
    objetivo: SELLOS_PREMIO,
    premioListo: s.sellos >= SELLOS_PREMIO,
    premios: s.premios,
    desde: s.creado,
  };
}

// ---------- sesión de administración ----------
const COOKIE = 'hk_fid_admin';
const DURACION_SESION = 60 * 60 * 24 * 30; // 30 días

async function firmar(texto, secreto) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(texto)));
}

function iguales(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function secretoAdmin(env) {
  if (!env.ADMIN_PASSWORD) throw new HttpError(500, 'Falta la variable ADMIN_PASSWORD en Cloudflare Pages.');
  return 'hanaki-fidelidad:' + env.ADMIN_PASSWORD;
}

export async function passwordCorrecta(env, pass) {
  const s = secretoAdmin(env);
  return iguales(await firmar(String(pass || ''), s), await firmar(env.ADMIN_PASSWORD, s));
}

export async function cookieSesion(env) {
  const exp = Math.floor(Date.now() / 1000) + DURACION_SESION;
  const firma = await firmar(String(exp), secretoAdmin(env));
  return `${COOKIE}=${exp}.${firma}; Path=/; Max-Age=${DURACION_SESION}; HttpOnly; Secure; SameSite=Strict`;
}

export const cookieCerrar = `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

export async function sesionValida(request, env) {
  const m = (request.headers.get('cookie') || '').match(new RegExp(COOKIE + '=(\\d+)\\.([a-f0-9]{64})'));
  if (!m) return false;
  if (Number(m[1]) < Date.now() / 1000) return false;
  return iguales(m[2], await firmar(m[1], secretoAdmin(env)));
}

export async function buscarSocio(DB, { id, token, codigo }) {
  if (id) return DB.prepare('SELECT * FROM socios WHERE id = ?').bind(Number(id)).first();
  if (token) return DB.prepare('SELECT * FROM socios WHERE token = ?').bind(String(token)).first();
  if (codigo) return DB.prepare('SELECT * FROM socios WHERE codigo = ?').bind(String(codigo).toUpperCase().trim()).first();
  return null;
}

// ---------- emails (Resend) ----------
// Devuelve true si se envió, false si no hay clave configurada. Lanza HttpError si Resend falla.
export async function enviarEmail(env, { para, asunto, html, texto, de, idem }) {
  if (!env.RESEND_API_KEY) return false;
  const enviar = () => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', ...(idem ? { 'idempotency-key': idem } : {}) },
    body: JSON.stringify({ from: de || env.EMAIL_FROM || 'Hanaki Sushi <tarjeta@hanakisushi.com>', to: [para], subject: asunto, html, text: texto }),
  });
  let r;
  try { r = await enviar(); } catch { r = null; }
  if (!r || r.status >= 500 || r.status === 429) { await new Promise((ok) => setTimeout(ok, 1200)); r = await enviar(); }
  if (!r.ok) { console.error('Resend', r.status, await r.text()); throw new HttpError(502, 'No se pudo enviar el email.'); }
  return true;
}

export const escapar = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
