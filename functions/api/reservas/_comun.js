// Reservas Hanaki — utilidades compartidas (no crea ninguna ruta)
import { HttpError, escapar, nuevoToken } from '../fidelidad/_lib.js';
export { json, db, handle, body, HttpError, normalizarTelefono, sesionValida, enviarEmail, escapar, nuevoToken } from '../fidelidad/_lib.js';

// Turnos (hora de llegada). Se puede reservar cada 15 minutos; últimas llegadas 16:15 y 23:15.
export const HORAS = {
  mediodia: ['12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45', '16:00', '16:15'],
  noche: ['20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45', '22:00', '22:15', '22:30', '22:45', '23:00', '23:15'],
};
export const TODAS_HORAS = [...HORAS.mediodia, ...HORAS.noche];
export const MAX_PERSONAS = 20;
export const DIAS_ANTELACION = 60;
export const ESTADOS = ['pendiente', 'confirmada', 'cancelada', 'llego', 'no_vino'];
export const HORAS_LIMITE_CAMBIO = 2; // «Mi reserva»: el cliente puede cambiar o cancelar hasta 2 h antes
export const MAX_CAMBIOS = 5;          // cambios máximos del cliente por reserva

let listo = false;
export async function tabla(DB) {
  if (listo) return;
  await DB.prepare(`CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    email TEXT,
    adultos INTEGER NOT NULL DEFAULT 1,
    ninos INTEGER NOT NULL DEFAULT 0,
    bebes INTEGER NOT NULL DEFAULT 0,
    trona INTEGER NOT NULL DEFAULT 0,
    carrito INTEGER NOT NULL DEFAULT 0,
    cumple INTEGER NOT NULL DEFAULT 0,
    comentarios TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    creado TEXT NOT NULL DEFAULT (datetime('now')),
    actualizado TEXT)`).run();
  await DB.prepare('CREATE INDEX IF NOT EXISTS idx_res_fecha ON reservas(fecha, hora)').run();
  // Horas cerradas por el panel (una fila por día y hora)
  await DB.prepare(`CREATE TABLE IF NOT EXISTS reservas_cierres (
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    creado TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (fecha, hora))`).run();
  // «Mi reserva»: enlace privado del cliente (token), cuántas veces la ha cambiado y aviso al personal (por_cliente = 1)
  const cols = new Set((await DB.prepare('PRAGMA table_info(reservas)').all()).results.map((c) => c.name));
  for (const [c, tipo] of [['token', 'TEXT'], ['cambios', 'INTEGER NOT NULL DEFAULT 0'], ['por_cliente', 'INTEGER NOT NULL DEFAULT 0']]) {
    if (cols.has(c)) continue;
    try { await DB.prepare(`ALTER TABLE reservas ADD COLUMN ${c} ${tipo}`).run(); }
    catch (e) { if (!/duplicate column/i.test(String(e && e.message))) throw e; }
  }
  await DB.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_res_token ON reservas(token)').run();
  listo = true;
}

// Valida día, hora y personas de una reserva nueva o cambiada. Devuelve los datos limpios.
// antes = reserva que se está cambiando (su hora sigue valiendo aunque después se haya cerrado)
export async function validarDatos(DB, d, antes = null) {
  const ent = (v, min, max) => Math.max(min, Math.min(max, parseInt(v, 10) || 0));
  const fecha = String(d.fecha || ''), hora = String(d.hora || '');
  const adultos = ent(d.adultos, 0, MAX_PERSONAS), ninos = ent(d.ninos, 0, MAX_PERSONAS), bebes = ent(d.bebes, 0, 10);
  validarFecha(fecha);
  const hoy = hoyMadrid();
  if (fecha < hoy) throw new HttpError(400, 'Ese día ya ha pasado.');
  const limite = new Date(Date.parse(hoy) + DIAS_ANTELACION * 864e5).toISOString().slice(0, 10);
  if (fecha > limite) throw new HttpError(400, `Solo se puede reservar con ${DIAS_ANTELACION} días de antelación como máximo.`);
  if (!TODAS_HORAS.includes(hora)) throw new HttpError(400, 'Elige una hora.');
  if (fecha === hoy && hora <= horaMadrid()) throw new HttpError(400, 'Esa hora ya ha pasado. Elige otra.');
  const misma = antes && antes.fecha === fecha && antes.hora === hora;
  if (!misma && (await horasCerradas(DB, fecha)).includes(hora)) throw new HttpError(409, 'Esa hora ya no está disponible. Elige otra o llámanos al 931 94 22 61.');
  if (adultos + ninos < 1) throw new HttpError(400, 'Indica cuántas personas venís.');
  if (adultos + ninos + bebes > MAX_PERSONAS) throw new HttpError(400, `Para más de ${MAX_PERSONAS} personas llámanos al 931 94 22 61.`);
  return { fecha, hora, adultos, ninos, bebes };
}

// ¿Puede el cliente todavía cambiar o cancelar? (activa y faltan más de HORAS_LIMITE_CAMBIO)
export function editable(r) {
  if (!['pendiente', 'confirmada'].includes(r.estado)) return false;
  const hoy = hoyMadrid();
  if (r.fecha < hoy) return false;
  if (r.fecha > hoy) return true;
  const [h, m] = r.hora.split(':').map(Number), [ah, am] = horaMadrid().split(':').map(Number);
  return (h * 60 + m) - (ah * 60 + am) > HORAS_LIMITE_CAMBIO * 60;
}

// Garantiza que la reserva tiene enlace privado (las reservas anteriores a «Mi reserva» no lo tenían)
export async function asegurarToken(DB, r) {
  if (r.token) return r;
  return DB.prepare('UPDATE reservas SET token = ? WHERE id = ? RETURNING *').bind(nuevoToken(), r.id).first();
}

// Horas cerradas de un día (array de 'HH:MM')
export async function horasCerradas(DB, fecha) {
  const r = await DB.prepare('SELECT hora FROM reservas_cierres WHERE fecha = ? ORDER BY hora').bind(fecha).all();
  return r.results.map((x) => x.hora);
}

// Fecha de hoy en Barcelona (YYYY-MM-DD)
export function hoyMadrid() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function horaMadrid() {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export function fechaLarga(f) {
  const [y, m, d] = f.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${DIAS[dt.getUTCDay()]} ${d} de ${MESES[m - 1]}`;
}
export function personasTexto(r) {
  const p = [`${r.adultos} adulto${r.adultos === 1 ? '' : 's'}`];
  if (r.ninos) p.push(`${r.ninos} niño${r.ninos === 1 ? '' : 's'}`);
  if (r.bebes) p.push(`${r.bebes} bebé${r.bebes === 1 ? '' : 's'}`);
  return p.join(', ');
}

// Email al cliente: recibida / confirmada / cancelada (por el restaurante) / cancelada_cliente / modificada
// base = origen de la web (https://hanakisushi.com) para el botón «Cambiar o cancelar mi reserva».
export function emailReserva(r, tipo, base) {
  const titulo = {
    recibida: 'Hemos recibido tu reserva', confirmada: 'Tu reserva está confirmada', cancelada: 'Tu reserva se ha cancelado',
    cancelada_cliente: 'Has cancelado tu reserva', modificada: 'Hemos recibido el cambio de tu reserva',
  }[tipo];
  const intro = {
    recibida: 'Gracias por reservar en Hanaki. Te avisaremos por email en cuanto el restaurante la confirme.',
    confirmada: '¡Te esperamos! Si no puedes venir o necesitas cambiar algo, hazlo desde el botón de abajo o llámanos.',
    cancelada: 'Tu reserva ha quedado cancelada. Si crees que es un error, llámanos.',
    cancelada_cliente: 'Tu reserva ha quedado cancelada. Gracias por avisarnos: así liberamos la mesa. ¡Esperamos verte pronto!',
    modificada: 'Estos son los nuevos datos. Te avisaremos por email en cuanto el restaurante confirme el cambio.',
  }[tipo];
  const conEnlace = base && r.token && ['recibida', 'confirmada', 'modificada'].includes(tipo);
  const enlace = conEnlace ? `${base}/reservas/mi-reserva?t=${r.token}` : '';
  const boton = conEnlace ? `
    <a href="${enlace}" style="display:block;margin:22px 0 0;padding:15px 18px;background:#E0452E;border-radius:999px;color:#0A0A0A;text-align:center;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:.2em">CAMBIAR O CANCELAR MI RESERVA</a>
    <p style="font-size:12.5px;line-height:1.6;margin:10px 0 0;color:#8F887E">Puedes cambiar el día, la hora o las personas hasta ${HORAS_LIMITE_CAMBIO} horas antes.</p>` : '';
  const html = `<!doctype html><html><body style="margin:0;background:#0A0A0A;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:36px 24px;color:#BDB7AE">
    <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:.3em;color:#F2EEE8">HANAKI</div>
    <div style="font-size:11px;letter-spacing:.26em;color:#C9A45C;margin-top:4px">RESERVAS</div>
    <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:28px;color:#F2EEE8;margin:28px 0 10px">${titulo}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px">Hola ${escapar(r.nombre)}, ${intro}</p>
    <table style="width:100%;border-collapse:collapse;font-size:15px;color:#F2EEE8;background:#141414;border:1px solid #6b5a3a">
      <tr><td style="padding:12px 16px;color:#C9A45C;width:90px">Día</td><td style="padding:12px 16px">${fechaLarga(r.fecha)}</td></tr>
      <tr><td style="padding:12px 16px;color:#C9A45C;border-top:1px solid #2a2a2a">Hora</td><td style="padding:12px 16px;border-top:1px solid #2a2a2a">${r.hora}</td></tr>
      <tr><td style="padding:12px 16px;color:#C9A45C;border-top:1px solid #2a2a2a">Personas</td><td style="padding:12px 16px;border-top:1px solid #2a2a2a">${personasTexto(r)}</td></tr>
    </table>${boton}
    <p style="font-size:13px;line-height:1.6;margin:22px 0 0">Hanaki Sushi · Carrer de Joan Güell, 212 · Les Corts, Barcelona<br>Teléfono: 931 94 22 61</p>
  </div></body></html>`;
  const texto = `${titulo}. ${fechaLarga(r.fecha)} a las ${r.hora}, ${personasTexto(r)}.${enlace ? ' Cambiar o cancelar: ' + enlace : ''} Hanaki Sushi, Carrer de Joan Güell 212. Tel. 931 94 22 61`;
  return { asunto: `${titulo} · ${fechaLarga(r.fecha)}, ${r.hora}`, html, texto };
}

export function validarFecha(f) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f || '')) throw new HttpError(400, 'Elige un día.');
}
