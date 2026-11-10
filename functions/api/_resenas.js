// Petición de reseña en Google al día siguiente de la visita (no crea ninguna ruta).
// Se llama cuando el personal marca una reserva como «Ha llegado» o pone un sello en la tarjeta.
// - Un mismo email recibe como mucho una petición cada DIAS_ENTRE_PETICIONES.
// - Todos los clientes reciben el mismo enlace a Google (sin filtrar por opinión, como exige Google).
// - Enlace para darse de baja en cada email (/api/resenas/baja).
// Variables opcionales: GOOGLE_RESENA_URL (enlace «Pedir reseñas» de Google Business Profile, tipo https://g.page/r/XXXX/review)
//                       EMAIL_RESPUESTAS (si el cliente responde al email, le llega a esta dirección)
import { enviarEmail, escapar, firmar, secretoAdmin } from './fidelidad/_lib.js';

export const DIAS_ENTRE_PETICIONES = 90;
export const HORAS_DESPUES = 20; // se envía unas 20 h después de marcar la visita (al día siguiente por la tarde)
// Ficha de Google Maps de Restaurante Sushi Hanaki (por si no se configura GOOGLE_RESENA_URL)
const RESENA_POR_DEFECTO = 'https://www.google.com/maps?cid=6595342441819088716';

export const urlResena = (env) => env.GOOGLE_RESENA_URL || RESENA_POR_DEFECTO;

let tablaLista = false;
async function tabla(DB) {
  if (tablaLista) return;
  await DB.prepare(`CREATE TABLE IF NOT EXISTS resenas (
    email TEXT PRIMARY KEY,
    nombre TEXT,
    origen TEXT,
    enviado TEXT,
    veces INTEGER NOT NULL DEFAULT 0,
    baja INTEGER NOT NULL DEFAULT 0,
    creado TEXT NOT NULL DEFAULT (datetime('now')))`).run();
  tablaLista = true;
}

export const firmaBaja = async (env, email) => (await firmar('baja:' + email, secretoAdmin(env))).slice(0, 32);

export async function marcarBaja(env, DB, email) {
  await tabla(DB);
  await DB.prepare(`INSERT INTO resenas (email, baja) VALUES (?, 1) ON CONFLICT(email) DO UPDATE SET baja = 1`).bind(email).run();
}

function email(nombre, enlace, baja) {
  const html = `<!doctype html><html><body style="margin:0;background:#0A0A0A;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:36px 24px;color:#BDB7AE">
    <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:.3em;color:#F2EEE8">HANAKI</div>
    <div style="font-size:11px;letter-spacing:.26em;color:#C9A45C;margin-top:4px">SUSHI · BARCELONA</div>
    <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:28px;color:#F2EEE8;margin:28px 0 10px">¿Qué tal ayer en Hanaki?</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 14px">Hola ${escapar(nombre)}, gracias por venir a vernos.</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 22px">Si tienes un minuto, cuéntalo en Google. Nos ayuda muchísimo a que más gente nos encuentre, y leemos todas las reseñas.</p>
    <a href="${enlace}" style="display:block;padding:16px 18px;background:#B3121F;color:#FFFFFF;text-align:center;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:.2em">DEJAR MI RESEÑA EN GOOGLE</a>
    <p style="font-size:13px;line-height:1.6;margin:22px 0 0">Hanaki Sushi · Carrer de Joan Güell, 212 · Les Corts, Barcelona<br>Teléfono: 931 94 22 61</p>
    <p style="font-size:11.5px;line-height:1.6;margin:22px 0 0;color:#6B6B6B">Te escribimos porque has visitado Hanaki. <a href="${baja}" style="color:#8F887E">No quiero recibir más emails como este</a>.</p>
  </div></body></html>`;
  const texto = `Hola ${nombre}, gracias por venir a Hanaki. Si tienes un minuto, cuéntalo en Google: ${enlace}\n\nNo quiero recibir más emails como este: ${baja}`;
  return { asunto: '¿Qué tal ayer en Hanaki?', html, texto };
}

// Programa el email. Nunca lanza: si algo falla, solo lo deja en el registro.
// base = origen de la web (https://hanakisushi.com), origen = 'reserva' | 'tarjeta'
export async function programarResena(env, DB, { email: para, nombre, origen, base }) {
  try {
    para = String(para || '').trim().toLowerCase();
    if (!para || !env.RESEND_API_KEY || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(para)) return false;
    await tabla(DB);
    // Reserva el envío solo si no se le pidió en los últimos DIAS_ENTRE_PETICIONES y no se ha dado de baja
    const fila = await DB.prepare(`INSERT INTO resenas (email, nombre, origen, enviado, veces) VALUES (?, ?, ?, datetime('now'), 1)
      ON CONFLICT(email) DO UPDATE SET nombre = excluded.nombre, origen = excluded.origen, enviado = excluded.enviado, veces = veces + 1
      WHERE baja = 0 AND (enviado IS NULL OR enviado < datetime('now', '-${DIAS_ENTRE_PETICIONES} days'))
      RETURNING email`).bind(para, nombre || '', origen || '').first();
    if (!fila) return false;

    const baja = `${base}/api/resenas/baja?e=${encodeURIComponent(para)}&f=${await firmaBaja(env, para)}`;
    const m = email(nombre || 'hola', urlResena(env), baja);
    const programado = new Date(Date.now() + HORAS_DESPUES * 3600e3).toISOString();
    try {
      await enviarEmail(env, {
        para, asunto: m.asunto, html: m.html, texto: m.texto, programado,
        de: env.EMAIL_FROM_RESENAS || 'Hanaki Sushi <hola@hanakisushi.com>',
        responder: env.EMAIL_RESPUESTAS || undefined,
        cabeceras: { 'List-Unsubscribe': `<${baja}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
        idem: `hanaki-resena-${para}-${new Date().toISOString().slice(0, 10)}`,
      });
      return true;
    } catch (e) {
      // no se pudo programar: se libera para que se pueda intentar en la próxima visita
      await DB.prepare(`UPDATE resenas SET enviado = NULL, veces = MAX(veces - 1, 0) WHERE email = ?`).bind(para).run();
      console.error('reseña', e);
      return false;
    }
  } catch (e) { console.error('reseña', e); return false; }
}
