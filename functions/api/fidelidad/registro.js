// POST /api/fidelidad/registro — alta de un cliente nuevo
import { json, dbListo, handle, body, HttpError, nuevoToken, nuevoCodigo, normalizarTelefono, tarjetaPublica } from './_lib.js';

export const onRequestPost = handle(async ({ request, env }) => {
  const DB = await dbListo(env);
  const d = await body(request);

  if (d.web) return json({ ok: true }); // campo trampa anti-bots

  const nombre = String(d.nombre || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const telefono = normalizarTelefono(d.telefono);
  const email = String(d.email || '').trim().toLowerCase().slice(0, 120) || null;

  if (nombre.length < 2) throw new HttpError(400, 'Escribe tu nombre.');
  if (!telefono) throw new HttpError(400, 'El teléfono no es válido.');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'Escribe un email válido (lo necesitas para recuperar tu tarjeta).');
  if (!d.privacidad) throw new HttpError(400, 'Tienes que aceptar la política de privacidad.');

  const existe = await DB.prepare('SELECT id FROM socios WHERE telefono = ?').bind(telefono).first();
  if (existe) throw new HttpError(409, 'Este teléfono ya tiene una tarjeta. Pulsa «Ver mi tarjeta» para abrirla.');
  const mismoEmail = await DB.prepare('SELECT id FROM socios WHERE email = ?').bind(email).first();
  if (mismoEmail) throw new HttpError(409, 'Este email ya tiene una tarjeta. Pulsa «Ver mi tarjeta» para abrirla.');

  for (let intento = 0; intento < 5; intento++) {
    const token = nuevoToken();
    const codigo = nuevoCodigo();
    try {
      const socio = await DB.prepare(
        'INSERT INTO socios (token, codigo, nombre, telefono, email, acepta_promos) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
      ).bind(token, codigo, nombre, telefono, email, d.promos ? 1 : 0).first();
      return json({ token, tarjeta: tarjetaPublica(socio) }, 201);
    } catch (e) {
      if (!/UNIQUE/i.test(String(e.message))) throw e;
      if (/telefono/i.test(String(e.message))) throw new HttpError(409, 'Este teléfono ya tiene una tarjeta.');
      // colisión de código/token: se reintenta
    }
  }
  throw new HttpError(500, 'No se pudo crear la tarjeta. Inténtalo de nuevo.');
});
