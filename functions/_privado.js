// Interruptores de lo que está cerrado al público.
// Con el interruptor en true solo pasa quien tenga abierta la sesión del panel (/admin/, ADMIN_PASSWORD).
//  · FIDELIDAD_PRIVADA: tarjeta de puntos (/fidelidad/ y sus APIs de cliente). Al abrirla, sacar también
//    los bloques <template id="fid-privado"> de index.html y carta.html y volver a poner /fidelidad/ en sitemap.xml.
//  · RESERVAS_PRIVADAS: reservas online (/reservas/ y /api/reservas/crear).
import { sesionValida } from './api/fidelidad/_lib.js';

export const FIDELIDAD_PRIVADA = false;
export const RESERVAS_PRIVADAS = false;

export function cerrar(activo, rutas, { pagina = false } = {}) {
  return async (ctx) => {
    const { request, env, next } = ctx;
    if (!activo) return next();
    const p = new URL(request.url).pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
    if (!rutas.includes(p)) return next();
    if (await sesionValida(request, env).catch(() => false)) return next();
    if (pagina) return new Response(null, { status: 302, headers: { location: '/', 'cache-control': 'no-store' } });
    return new Response(JSON.stringify({ error: 'La tarjeta de puntos todavía no está disponible.' }), { status: 403, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  };
}
