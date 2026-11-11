// Reservas Hanaki — utilidades compartidas (no crea ninguna ruta)
import { HttpError, escapar } from '../fidelidad/_lib.js';
export { json, db, handle, body, HttpError, normalizarTelefono, sesionValida, enviarEmail, escapar } from '../fidelidad/_lib.js';

// Turnos (hora de llegada). Se puede reservar cada 15 minutos; últimas llegadas 16:15 y 23:15.
export const HORAS = {
  mediodia: ['12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45', '16:00', '16:15'],
  noche: ['20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45', '22:00', '22:15', '22:30', '22:45', '23:00', '23:15'],
};
export const TODAS_HORAS = [...HORAS.mediodia, ...HORAS.noche];
export const MAX_PERSONAS = 20;
export const DIAS_ANTELACION = 60;
export const ESTADOS = ['pendiente', 'confirmada', 'cancelada', 'llego', 'no_vino'];

export async function tabla(DB) {
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

// Email al cliente (recibida / confirmada / cancelada)
export function emailReserva(r, tipo) {
  const titulo = { recibida: 'Hemos recibido tu reserva', confirmada: 'Tu reserva está confirmada', cancelada: 'Tu reserva se ha cancelado' }[tipo];
  const intro = {
    recibida: 'Gracias por reservar en Hanaki. Te avisaremos por email en cuanto el restaurante la confirme.',
    confirmada: '¡Te esperamos! Si no puedes venir, llámanos para liberar la mesa.',
    cancelada: 'Tu reserva ha quedado cancelada. Si crees que es un error, llámanos.',
  }[tipo];
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
    </table>
    <p style="font-size:13px;line-height:1.6;margin:22px 0 0">Hanaki Sushi · Carrer de Joan Güell, 212 · Les Corts, Barcelona<br>Teléfono: 931 94 22 61</p>
  </div></body></html>`;
  const texto = `${titulo}. ${fechaLarga(r.fecha)} a las ${r.hora}, ${personasTexto(r)}. Hanaki Sushi, Carrer de Joan Güell 212. Tel. 931 94 22 61`;
  return { asunto: `${titulo} · ${fechaLarga(r.fecha)}, ${r.hora}`, html, texto };
}

export function validarFecha(f) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f || '')) throw new HttpError(400, 'Elige un día.');
}
