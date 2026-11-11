// Utilidades compartidas de la tarjeta de fidelidad (Cloudflare Pages Functions + D1).
// No exporta onRequest, así que no crea ninguna ruta pública.

export const SELLOS_PREMIO = 8;          // (sistema antiguo de sellos; se conserva para convertir los sellos a puntos)
export const MINUTOS_ENTRE_SELLOS = 60;

// ---------- SISTEMA DE PUNTOS (sustituye a los sellos) ----------
// Regla: por cada TRAMO_EUROS completos de consumo, el cliente gana PUNTOS_TRAMO puntos.
export const TRAMO_EUROS = 10;
export const PUNTOS_TRAMO = 1000;
export const MINUTOS_ENTRE_COMPRAS = 30;  // aviso si se suman puntos dos veces seguidas al mismo cliente
export const IMPORTE_MAXIMO = 3000;       // tope de seguridad por cuenta (€)
export function puntosDe(importe) {
  const e = Number(importe);
  if (!Number.isFinite(e) || e <= 0) return 0;
  return Math.floor(e / TRAMO_EUROS + 1e-9) * PUNTOS_TRAMO;
}
// Tienda inicial (se crea sola la primera vez; después se edita desde el panel). puntos = null → «Próximamente».
// El 4.º valor marca un premio de precio variable: los puntos se escriben al canjear (p. ej. cada gato lleva su precio).
export const PREMIOS_INICIALES = [
  ['Menú del día', 'De lunes a viernes al mediodía', 12000],
  ['Buffet de mediodía', 'Sin platos especiales', 22000],
  ['Buffet con platos especiales', 'Noches, fines de semana y festivos', 30000],
  ['Gato de la suerte', 'Cada gato lleva sus puntos en la etiqueta', null, 1],
];

// Cada socio colecciona los sellos por separado en tres tipos (columnas sellos_<id> y premios_<id> en la tabla socios).
export const TIPOS = {
  mediodia: { nombre: 'Buffet mediodía', premio: 'Buffet de mediodía gratis' },
  noche:    { nombre: 'Buffet noche',    premio: 'Buffet de noche gratis' },
  menu:     { nombre: 'Menú',            premio: 'Menú gratis' },
};
export const TIPO_IDS = Object.keys(TIPOS);

// Valida el tipo que llega del cliente (solo estos ids se usan para formar nombres de columna)
export function tipoDe(v) {
  const t = String(v || '');
  if (!Object.prototype.hasOwnProperty.call(TIPOS, t)) throw new HttpError(400, 'Elige el tipo de sello: mediodía, noche o menú.');
  return t;
}

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

// Añade solo las columnas que falten (sellos y premios por tipo). Se ejecuta una vez por instancia:
// así no hay que tocar la base de datos a mano al desplegar. Los sellos que ya tenía cada socio pasan a «mediodía».
let esquemaListo = false;
export async function esquema(DB) {
  if (esquemaListo) return;
  const columnas = async (tabla) => new Set((await DB.prepare(`PRAGMA table_info(${tabla})`).all()).results.map((c) => c.name));
  const anadir = async (sql) => {
    try { await DB.prepare(sql).run(); return true; }
    catch (e) { if (/duplicate column/i.test(String(e && e.message))) return false; throw e; }
  };
  const socios = await columnas('socios');
  let migrar = false;
  for (const t of TIPO_IDS) {
    const s = await (socios.has('sellos_' + t) ? false : anadir(`ALTER TABLE socios ADD COLUMN sellos_${t} INTEGER NOT NULL DEFAULT 0`));
    if (t === 'mediodia' && s) migrar = true;
    if (!socios.has('premios_' + t)) await anadir(`ALTER TABLE socios ADD COLUMN premios_${t} INTEGER NOT NULL DEFAULT 0`);
  }
  if (migrar) await DB.prepare('UPDATE socios SET sellos_mediodia = sellos, premios_mediodia = premios').run();
  const movs = await columnas('movimientos');
  if (!movs.has('tipo_sello')) await anadir('ALTER TABLE movimientos ADD COLUMN tipo_sello TEXT');

  // ----- puntos -----
  if (!socios.has('puntos')) await anadir('ALTER TABLE socios ADD COLUMN puntos INTEGER');               // NULL = aún con sellos sin convertir
  if (!socios.has('puntos_totales')) await anadir('ALTER TABLE socios ADD COLUMN puntos_totales INTEGER NOT NULL DEFAULT 0');
  for (const [c, tipo] of [['puntos', 'INTEGER'], ['importe', 'REAL'], ['premio_id', 'INTEGER'], ['nota', 'TEXT']]) {
    if (!movs.has(c)) await anadir(`ALTER TABLE movimientos ADD COLUMN ${c} ${tipo}`);
  }
  await DB.prepare(`CREATE TABLE IF NOT EXISTS premios (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, descripcion TEXT, puntos INTEGER,
    activo INTEGER NOT NULL DEFAULT 1, orden INTEGER NOT NULL DEFAULT 0, variable INTEGER NOT NULL DEFAULT 0, creado TEXT NOT NULL DEFAULT (datetime('now')))`).run();
  if (!(await columnas('premios')).has('variable')) await anadir('ALTER TABLE premios ADD COLUMN variable INTEGER NOT NULL DEFAULT 0');
  await DB.prepare(`CREATE TABLE IF NOT EXISTS ajustes_fid (clave TEXT PRIMARY KEY, valor TEXT)`).run();
  if (!(await DB.prepare(`SELECT valor FROM ajustes_fid WHERE clave = 'tienda_creada'`).first())) {
    await DB.batch([
      ...PREMIOS_INICIALES.map(([n, d, p, v], i) => DB.prepare('INSERT INTO premios (nombre, descripcion, puntos, orden, variable) VALUES (?, ?, ?, ?, ?)').bind(n, d, p, i, v ? 1 : 0)),
      DB.prepare(`INSERT OR IGNORE INTO ajustes_fid (clave, valor) VALUES ('tienda_creada', datetime('now'))`),
    ]);
  }
  // Los clientes que venían del sistema de sellos empiezan con 0 puntos (decisión del restaurante, 11-11-2026).
  // Sus sellos antiguos no se borran de la base de datos, simplemente ya no se usan.
  await DB.prepare('UPDATE socios SET puntos = 0 WHERE puntos IS NULL').run();
  esquemaListo = true;
}

// Base de datos con el esquema al día (usar en las rutas de fidelidad en lugar de db(env))
export async function dbListo(env) {
  const DB = db(env);
  await esquema(DB);
  return DB;
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

// Tienda de premios. todos = true incluye los ocultos (para el panel)
export async function listaPremios(DB, todos = false) {
  const r = await DB.prepare(`SELECT id, nombre, descripcion, puntos, activo, orden, variable FROM premios ${todos ? '' : 'WHERE activo = 1'} ORDER BY variable, (puntos IS NULL), puntos, orden, id`).all();
  return r.results;
}
export const reglaPuntos = () => ({ euros: TRAMO_EUROS, puntos: PUNTOS_TRAMO });

// Datos que puede ver el propio cliente en su tarjeta
export function tarjetaPublica(s, premios = [], movimientos = []) {
  const saldo = s.puntos || 0;
  return {
    nombre: s.nombre,
    codigo: s.codigo,
    puntos: saldo,
    puntosTotales: s.puntos_totales || 0,
    regla: reglaPuntos(),
    premios: premios.map((p) => ({
      id: p.id, nombre: p.nombre, descripcion: p.descripcion || '', puntos: p.variable ? null : p.puntos, variable: !!p.variable,
      listo: !p.variable && p.puntos != null && saldo >= p.puntos, faltan: p.variable || p.puntos == null ? null : Math.max(0, p.puntos - saldo),
    })),
    movimientos,
    canjeados: s.premios || 0,
    desde: s.creado,
  };
}

// ---------- sesión de administración ----------
const COOKIE = 'hk_fid_admin';
const DURACION_SESION = 60 * 60 * 24 * 30; // 30 días

export async function firmar(texto, secreto) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(texto)));
}

function iguales(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export function secretoAdmin(env) {
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
// programado: fecha ISO para que Resend lo envíe más tarde · responder: reply-to · cabeceras: p. ej. List-Unsubscribe
export async function enviarEmail(env, { para, asunto, html, texto, de, idem, programado, responder, cabeceras }) {
  if (!env.RESEND_API_KEY) return false;
  const datos = { from: de || env.EMAIL_FROM || 'Hanaki Sushi <tarjeta@hanakisushi.com>', to: [para], subject: asunto, html, text: texto };
  if (programado) datos.scheduled_at = programado;
  if (responder) datos.reply_to = responder;
  if (cabeceras) datos.headers = cabeceras;
  const enviar = () => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', ...(idem ? { 'idempotency-key': idem } : {}) },
    body: JSON.stringify(datos),
  });
  let r;
  try { r = await enviar(); } catch { r = null; }
  if (!r || r.status >= 500 || r.status === 429) { await new Promise((ok) => setTimeout(ok, 1200)); r = await enviar(); }
  if (!r.ok) { console.error('Resend', r.status, await r.text()); throw new HttpError(502, 'No se pudo enviar el email.'); }
  return true;
}

export const escapar = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
