// Promociones por email a los socios de la tarjeta que aceptaron recibirlas (no crea ninguna ruta).
// - Solo se envía a socios con acepta_promos = 1 y email válido (casilla opcional del alta, LSSI/RGPD).
// - Cada email lleva su enlace para darse de baja (/api/promos/baja), que pone acepta_promos = 0.
// - Se envía con la API por lotes de Resend (100 emails por llamada). Cada envío queda apuntado en
//   promo_envios, así que si un lote falla se puede continuar sin repetir a quien ya lo recibió.
import { escapar, firmar, secretoAdmin, HttpError } from '../fidelidad/_lib.js';

export const LOTE = 100;
const EMAIL_OK = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Tipos de mensaje: cada uno rellena el formulario con un texto de partida que el personal edita.
// {nombre} = nombre del socio · {puntos} = sus puntos
export const TIPOS = {
  novedad: { nombre: 'Plato nuevo', asunto: 'Nuevo en Hanaki: ', etiqueta: 'NOVEDAD', titulo: 'Recién llegado a la carta',
    texto: 'Hola {nombre},\n\nTenemos algo nuevo en la carta y queremos que seas de los primeros en probarlo.\n\nTe esperamos en Joan Güell 212.', boton: 'VER LA CARTA', enlace: '/carta', foto: 'recien-hecho' },
  oferta: { nombre: 'Oferta', asunto: 'Esta semana en Hanaki', etiqueta: 'OFERTA', titulo: 'Solo esta semana',
    texto: 'Hola {nombre},\n\nDel lunes al jueves, …\n\nOferta válida en Hanaki Barcelona, Joan Güell 212. No acumulable a otras promociones.', boton: 'RESERVAR MESA', enlace: '/reservas/', foto: 'sala' },
  fecha: { nombre: 'Fecha especial', asunto: 'Celébralo en Hanaki', etiqueta: 'FECHA ESPECIAL', titulo: 'Un día para celebrar',
    texto: 'Hola {nombre},\n\nSe acerca una fecha especial y en Hanaki la celebramos con …\n\nLas mesas vuelan: reserva con tiempo.', boton: 'RESERVAR MESA', enlace: '/reservas/', foto: 'rincon-sombrillas' },
  echamos: { nombre: 'Te echamos de menos', asunto: '{nombre}, hace tiempo que no te vemos', etiqueta: 'TE ECHAMOS DE MENOS', titulo: '¿Una ronda más?',
    texto: 'Hola {nombre},\n\nHace un tiempo que no pasas por Hanaki y la barra no es lo mismo sin ti.\n\nVuelve cuando quieras: tu tarjeta sigue sumando puntos.', boton: 'RESERVAR MESA', enlace: '/reservas/', foto: 'barra', segmento: 'dormidos' },
  puntos: { nombre: 'Tus puntos', asunto: '{nombre}, tienes {puntos} puntos en Hanaki', etiqueta: 'TARJETA HANAKI', titulo: 'Tienes {puntos} puntos',
    texto: 'Hola {nombre},\n\nTu tarjeta de Hanaki tiene {puntos} puntos. Cada 10 € de cuenta suman 1.000 puntos, y con 12.000 ya tienes un menú del día gratis.\n\nEnseña tu tarjeta en caja en tu próxima visita.', boton: 'VER LA CARTA', enlace: '/carta', foto: 'maneki' },
  aviso: { nombre: 'Aviso del local', asunto: 'Aviso de Hanaki', etiqueta: 'AVISO', titulo: 'Horario especial',
    texto: 'Hola {nombre},\n\nQueremos avisarte de que …\n\nGracias por entenderlo. ¡Nos vemos pronto!', boton: 'LLAMAR AL 931 94 22 61', enlace: 'tel:+34931942261', foto: 'fachada' },
  libre: { nombre: 'Mensaje libre', asunto: '', etiqueta: 'HANAKI', titulo: '', texto: 'Hola {nombre},\n\n', boton: '', enlace: '', foto: '' },
};

// Fotos del local de Barcelona preparadas para email (assets/promos/*.jpg, 960 px)
export const FOTOS = ['sala', 'barra', 'recien-hecho', 'maneki', 'fachada', 'rincon-sombrillas', 'pasillo-ladrillo', 'robot'];

// A quién: siempre socios que aceptaron promociones y tienen email
export const SEGMENTOS = {
  todos: { nombre: 'Todos los que aceptaron', sql: '' },
  activos: { nombre: 'Han venido en los últimos 60 días', sql: `AND ultimo_sello >= datetime('now', '-60 days')` },
  dormidos: { nombre: 'No vienen desde hace más de 60 días', sql: `AND (ultimo_sello IS NULL OR ultimo_sello < datetime('now', '-60 days'))` },
  premio: { nombre: 'Tienen puntos para un premio', sql: 'AND COALESCE(puntos, 0) >= (SELECT COALESCE(MIN(puntos), 12000) FROM premios WHERE activo = 1 AND variable = 0 AND puntos > 0)' },
};

let tablaLista = false;
export async function tablas(DB) {
  if (tablaLista) return;
  await DB.batch([
    DB.prepare(`CREATE TABLE IF NOT EXISTS promos (
      id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT, segmento TEXT, asunto TEXT NOT NULL, datos TEXT NOT NULL,
      destinatarios INTEGER NOT NULL DEFAULT 0, enviados INTEGER NOT NULL DEFAULT 0, errores INTEGER NOT NULL DEFAULT 0,
      creado TEXT NOT NULL DEFAULT (datetime('now')), terminado TEXT)`),
    DB.prepare(`CREATE TABLE IF NOT EXISTS promo_envios (
      promo_id INTEGER NOT NULL, email TEXT NOT NULL, socio_id INTEGER, enviado TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (promo_id, email))`),
  ]);
  tablaLista = true;
}

export const firmaBajaPromo = async (env, email) => (await firmar('promo-baja:' + email, secretoAdmin(env))).slice(0, 32);
export const enlaceBaja = async (env, base, email) => `${base}/api/promos/baja?e=${encodeURIComponent(email)}&f=${await firmaBajaPromo(env, email)}`;

// Socios que recibirían la promoción (email en minúsculas, sin repetir)
export async function destinatarios(DB, segmento) {
  const s = SEGMENTOS[segmento] || SEGMENTOS.todos;
  const { results } = await DB.prepare(`SELECT id, nombre, lower(trim(email)) AS email, COALESCE(puntos, 0) AS puntos FROM socios
    WHERE acepta_promos = 1 AND email IS NOT NULL AND trim(email) != '' ${s.sql} ORDER BY id`).all();
  const vistos = new Set();
  return results.filter((r) => EMAIL_OK.test(r.email) && !vistos.has(r.email) && vistos.add(r.email));
}

// Limpia lo que llega del formulario del panel
export function limpiar(d) {
  const txt = (v, max) => String(v ?? '').replace(/\r/g, '').slice(0, max);
  const m = {
    tipo: TIPOS[d.tipo] ? d.tipo : 'libre',
    asunto: txt(d.asunto, 120).trim(),
    etiqueta: txt(d.etiqueta, 40).trim(),
    titulo: txt(d.titulo, 90).trim(),
    texto: txt(d.texto, 3000).trim(),
    boton: txt(d.boton, 40).trim(),
    enlace: txt(d.enlace, 300).trim(),
    foto: FOTOS.includes(d.foto) ? d.foto : '',
  };
  if (m.enlace && !/^(https:\/\/|\/|tel:\+?[0-9 ]+$|mailto:)/i.test(m.enlace)) throw new HttpError(400, 'El enlace del botón tiene que empezar por https://, / o tel:.');
  return m;
}

const nombrePila = (n) => String(n || '').trim().split(/\s+/)[0] || '';
const fmtPuntos = (p) => String(Math.round(Number(p) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
function rellenar(s, socio) {
  const nombre = nombrePila(socio.nombre);
  return String(s || '')
    .replace(/\{nombre\}/gi, nombre)
    .replace(/\{puntos\}/gi, fmtPuntos(socio.puntos))
    .replace(/^Hola ,/m, 'Hola,').replace(/^,\s*/, '').replace(/\s+,/g, ',');
}

// Monta el email de un socio. base = https://hanakisushi.com
export function montar(m, socio, base, baja) {
  const asunto = rellenar(m.asunto, socio) || 'Novedades de Hanaki';
  const titulo = rellenar(m.titulo, socio);
  const texto = rellenar(m.texto, socio);
  const enlace = !m.enlace ? '' : m.enlace.startsWith('/') ? base + m.enlace : m.enlace;
  const parrafos = texto.split(/\n{2,}/).map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#D9D3CA">${escapar(p).replace(/\n/g, '<br>')}</p>`).join('');
  const disp = `font-family:'Big Shoulders Display','Arial Narrow','Helvetica Neue',Arial,sans-serif;font-weight:900;text-transform:uppercase`;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@900&display=swap" rel="stylesheet"><title>${escapar(asunto)}</title></head>
<body style="margin:0;padding:0;background:#0A0A0A">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapar(texto.replace(/^Hola[^\n]*\n+/, '').slice(0, 110))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A"><tr><td align="center" style="padding:0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:Barlow,'Helvetica Neue',Helvetica,Arial,sans-serif">
  <tr><td style="padding:28px 24px 22px">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle;padding-right:10px"><img src="${base}/assets/logo.png" width="34" height="34" alt="花木" style="display:block;border:0"></td>
      <td style="vertical-align:middle;${disp};font-size:26px;letter-spacing:.04em;color:#F3EFE8">HANAKI</td>
    </tr></table>
  </td></tr>
  ${m.foto ? `<tr><td style="padding:0"><img src="${base}/assets/promos/${m.foto}.jpg" width="560" alt="" style="display:block;width:100%;max-width:560px;height:auto;border:0"></td></tr>` : ''}
  <tr><td style="padding:30px 24px 8px">
    ${m.etiqueta ? `<div style="font-size:12px;font-weight:600;letter-spacing:.22em;color:#E0452E;margin:0 0 10px">● ${escapar(rellenar(m.etiqueta, socio))}</div>` : ''}
    ${titulo ? `<h1 style="margin:0 0 20px;${disp};font-size:44px;line-height:.95;color:#F3EFE8">${escapar(titulo)}</h1>` : ''}
    ${parrafos}
  </td></tr>
  ${enlace && m.boton ? `<tr><td style="padding:6px 24px 30px"><a href="${escapar(enlace)}" style="display:block;padding:17px 18px;background:#E0452E;border-radius:999px;color:#0A0A0A;text-align:center;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.18em">${escapar(rellenar(m.boton, socio)).toUpperCase()}</a></td></tr>` : ''}
  <tr><td style="padding:22px 24px 34px;border-top:1px solid #2A2826">
    <div style="${disp};font-size:20px;color:#E0452E;letter-spacing:.03em;margin:0 0 10px">UNA RONDA MÁS</div>
    <p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:#9A948A">Hanaki Sushi · Carrer de Joan Güell, 212 · Les Corts, Barcelona · 931 94 22 61</p>
    <p style="margin:14px 0 0;font-size:11.5px;line-height:1.6;color:#6F6A63">Te escribimos porque al hacerte la tarjeta de Hanaki aceptaste recibir promociones. <a href="${baja}" style="color:#9A948A">Darme de baja</a>.</p>
  </td></tr>
</table></td></tr></table></body></html>`;
  const textoPlano = `${titulo ? titulo.toUpperCase() + '\n\n' : ''}${texto}${enlace && m.boton ? `\n\n${rellenar(m.boton, socio)}: ${enlace}` : ''}\n\n—\nHanaki Sushi · Carrer de Joan Güell, 212 · Barcelona · 931 94 22 61\nDarme de baja: ${baja}`;
  return { asunto, html, texto: textoPlano };
}

// Envía hasta LOTE emails en una sola llamada a Resend
export async function enviarLote(env, emails, idem) {
  if (!env.RESEND_API_KEY) throw new HttpError(500, 'Falta RESEND_API_KEY: no se pueden enviar emails.');
  const llamar = () => fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'idempotency-key': idem },
    body: JSON.stringify(emails),
  });
  let r;
  try { r = await llamar(); } catch { r = null; }
  if (!r || r.status >= 500 || r.status === 429) { await new Promise((ok) => setTimeout(ok, 1500)); try { r = await llamar(); } catch { r = null; } }
  if (!r || !r.ok) {
    const det = r ? await r.text().catch(() => '') : 'sin conexión';
    console.error('Resend batch', r && r.status, det);
    const limite = r && (r.status === 429 || /limit|quota/i.test(det));
    throw new HttpError(502, limite ? 'Resend ha llegado a su límite de envíos (en el plan gratis, 100 al día). Pulsa «Continuar envío» mañana.' : 'Resend no aceptó el envío. Inténtalo de nuevo en un rato.');
  }
  return true;
}
