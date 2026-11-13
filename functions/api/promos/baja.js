// GET  /api/promos/baja?e=EMAIL&f=FIRMA — el socio pulsa «Darme de baja» en un email de promoción
// POST (mismo enlace) — baja en un clic desde Gmail/Apple Mail (List-Unsubscribe-Post)
// Solo deja de recibir promociones: la tarjeta y sus puntos siguen igual.
import { db, handle } from '../fidelidad/_lib.js';
import { firmaBajaPromo } from './_promos.js';

const pagina = (titulo, texto) => new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${titulo} · Hanaki</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@900&family=Barlow:wght@400;600&display=swap"></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0A0A;color:#B9B3A9;font-family:Barlow,Helvetica,Arial,sans-serif;padding:24px;box-sizing:border-box">
<div style="max-width:440px;text-align:center"><img src="/assets/logo.png" width="48" height="48" alt="花木">
<h1 style="font-family:'Big Shoulders Display','Arial Narrow',sans-serif;font-weight:900;text-transform:uppercase;font-size:44px;line-height:.95;color:#F3EFE8;margin:22px 0 14px">${titulo}</h1>
<p style="font-size:16px;line-height:1.6;margin:0 0 26px">${texto}</p><a href="/" style="color:#E0452E;font-size:13px;font-weight:600;letter-spacing:.18em">VOLVER A LA WEB</a></div></body></html>`,
  { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });

async function baja({ request, env }) {
  const u = new URL(request.url);
  const email = String(u.searchParams.get('e') || '').trim().toLowerCase();
  const f = String(u.searchParams.get('f') || '');
  if (!email || f !== (await firmaBajaPromo(env, email))) return pagina('Enlace no válido', 'Este enlace no es correcto. Si quieres dejar de recibir promociones, llámanos al 931 94 22 61 y te damos de baja.');
  await db(env).prepare('UPDATE socios SET acepta_promos = 0 WHERE lower(trim(email)) = ?').bind(email).run();
  return pagina('Hecho', 'Ya no te enviaremos más promociones. Tu tarjeta y tus puntos siguen igual. ¡Hasta pronto!');
}

export const onRequestGet = handle(baja);
export const onRequestPost = handle(baja);
