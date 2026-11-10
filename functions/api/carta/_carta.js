// Cambios de la carta hechos desde el panel (no crea ninguna ruta).
// La carta base sigue en carta.html; aquí solo se guardan los cambios por plato o bebida:
//   clave 'p|<nombre del plato>'  o  'b|<grupo>|<nombre de la bebida>'
//   datos { nombre?, desc?, precio?, oculto?, agotado?: 'YYYY-MM-DD' (solo vale ese día) }
let lista = false;
export async function tablaCarta(DB) {
  if (lista) return;
  await DB.prepare(`CREATE TABLE IF NOT EXISTS carta (clave TEXT PRIMARY KEY, datos TEXT NOT NULL, actualizado TEXT NOT NULL DEFAULT (datetime('now')))`).run();
  lista = true;
}

export async function cambios(DB) {
  await tablaCarta(DB);
  const { results } = await DB.prepare('SELECT clave, datos, actualizado FROM carta').all();
  return results.map((r) => ({ clave: r.clave, actualizado: r.actualizado, datos: (() => { try { return JSON.parse(r.datos); } catch { return {}; } })() }));
}
