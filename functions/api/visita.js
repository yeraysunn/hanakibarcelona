// POST /api/visita {p: ruta, r: referrer, u: utm_source, e?: evento} — lo envía /estadisticas.js (sin cookies)
import { db } from './fidelidad/_lib.js';
import { tablaVisitas, origenDe, dispositivoDe, esBot } from './_estadisticas.js';

const EVENTOS = ['vista', 'llamar', 'whatsapp', 'como_llegar', 'reservar', 'reserva', 'tarjeta', 'carta', 'instagram'];
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const vacio = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });

export const onRequestPost = async ({ request, env, waitUntil }) => {
  try {
    const ua = request.headers.get('user-agent') || '';
    if (esBot(ua) || !env.DB) return vacio();
    const d = JSON.parse((await request.text()).slice(0, 2000) || '{}');
    const tipo = EVENTOS.includes(d.e) ? d.e : 'vista';
    let ruta = String(d.p || '/').split('?')[0].split('#')[0].slice(0, 80) || '/';
    if (/^\/(admin|api)\b|\/admin(\.html)?$/.test(ruta)) return vacio(); // el panel no cuenta
    ruta = ruta.replace(/\.html$/, '').replace(/\/index$/, '/');

    const ahora = new Date();
    const partes = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
      .formatToParts(ahora).map((p) => [p.type, p.value]));
    const dia = `${partes.year}-${partes.month}-${partes.day}`;
    const ip = request.headers.get('cf-connecting-ip') || '';
    const sal = 'hanaki-visitas:' + dia + ':' + (env.ADMIN_PASSWORD || '');
    const visitante = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sal + '|' + ip + '|' + ua))).slice(0, 16);
    const origen = origenDe({ utm: d.u, referrer: d.r, host: new URL(request.url).hostname, ua });

    const DB = db(env);
    waitUntil((async () => {
      await tablaVisitas(DB);
      await DB.prepare('INSERT INTO visitas (dia, hora, tipo, ruta, origen, dispositivo, pais, visitante) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(dia, Number(partes.hour), tipo, ruta, origen, dispositivoDe(ua), (request.cf && request.cf.country) || null, visitante).run();
    })().catch((e) => console.error('visita', e)));
  } catch (e) { /* una visita mal formada no importa */ }
  return vacio();
};
