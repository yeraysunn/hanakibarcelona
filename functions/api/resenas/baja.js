// GET  /api/resenas/baja?e=EMAIL&f=FIRMA — el cliente pulsa «No quiero recibir más emails como este»
// POST (mismo enlace) — baja en un clic desde Gmail/Apple Mail (List-Unsubscribe-Post)
import { db, handle } from '../fidelidad/_lib.js';
import { firmaBaja, marcarBaja } from '../_resenas.js';

const pagina = (titulo, texto) => new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${titulo} · Hanaki</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0A0A;color:#BDB7AE;font-family:Helvetica,Arial,sans-serif;padding:24px;box-sizing:border-box">
<div style="max-width:420px;text-align:center"><div style="font-family:Georgia,serif;font-size:22px;letter-spacing:.3em;color:#F2EEE8">HANAKI</div>
<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:28px;color:#F2EEE8;margin:28px 0 12px">${titulo}</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 24px">${texto}</p><a href="/" style="color:#C9A45C;font-size:13px;letter-spacing:.16em">VOLVER A LA WEB</a></div></body></html>`,
  { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });

async function baja({ request, env }) {
  const u = new URL(request.url);
  const email = String(u.searchParams.get('e') || '').trim().toLowerCase();
  const f = String(u.searchParams.get('f') || '');
  if (!email || f !== (await firmaBaja(env, email))) return pagina('Enlace no válido', 'Este enlace no es correcto. Si quieres dejar de recibir emails, responde a cualquiera de nuestros emails o llámanos al 931 94 22 61.');
  await marcarBaja(env, db(env), email);
  return pagina('Hecho', 'No te enviaremos más emails pidiendo tu opinión. ¡Gracias y hasta pronto!');
}

export const onRequestGet = handle(baja);
export const onRequestPost = handle(baja);
