// Reservas online y tarjeta de puntos: PRIVADAS mientras PRIVADO = true.
// Solo pasa quien tenga abierta la sesión del panel (/admin/, contraseña ADMIN_PASSWORD);
// el público reserva por teléfono. Para abrirlas al público: PRIVADO = false y volver a
// poner los enlaces en la web (bloques <template id="fid-privado"> en index.html y carta.html).
import { sesionValida } from './api/fidelidad/_lib.js';

export const PRIVADO = true;

// Páginas o APIs cerradas al público. `rutas` son prefijos ya normalizados (sin .html ni index).
export function cerrar(rutas, { pagina = false } = {}) {
  return async (ctx) => {
    const { request, env, next } = ctx;
    if (!PRIVADO) return next();
    let p = new URL(request.url).pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
    if (!rutas.some((r) => p === r)) return next();
    if (await sesionValida(request, env).catch(() => false)) return next();
    if (pagina) return new Response(null, { status: 302, headers: { location: '/#reservar', 'cache-control': 'no-store' } });
    return new Response(JSON.stringify({ error: 'De momento las reservas y la tarjeta de puntos solo están disponibles por teléfono: 931 94 22 61.' }), { status: 403, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  };
}
