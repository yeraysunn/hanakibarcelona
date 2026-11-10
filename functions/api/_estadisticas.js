// Estadísticas propias sin cookies (no crea ninguna ruta).
// No se guarda la IP ni nada que identifique a la persona: solo un resumen cifrado (hash) de IP + navegador
// con una clave que cambia cada día, para contar visitantes únicos del día sin poder seguirlos entre días.

let lista = false;
export async function tablaVisitas(DB) {
  if (lista) return;
  await DB.batch([
    DB.prepare(`CREATE TABLE IF NOT EXISTS visitas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dia TEXT NOT NULL,          -- YYYY-MM-DD (hora de Barcelona)
      hora INTEGER NOT NULL,      -- 0-23
      tipo TEXT NOT NULL,         -- 'vista' | nombre del evento (llamar, whatsapp, como_llegar, reservar, reserva, tarjeta…)
      ruta TEXT,
      origen TEXT,                -- google, instagram, tiktok, facebook, directo, interno u otra web
      dispositivo TEXT,           -- movil | ordenador | tablet
      pais TEXT,
      visitante TEXT)`),
    DB.prepare('CREATE INDEX IF NOT EXISTS idx_vis_dia ON visitas(dia, tipo)'),
  ]);
  lista = true;
}

// De dónde viene la visita: parámetro utm_source, navegador de Instagram/TikTok/Facebook o web de procedencia
export function origenDe({ utm, referrer, host, ua }) {
  const u = String(utm || '').toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 30);
  if (u) return u === 'ig' ? 'instagram' : u;
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/musical_ly|BytedanceWebview|TikTok/i.test(ua)) return 'tiktok';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'facebook';
  let h = '';
  try { h = new URL(referrer).hostname.replace(/^www\./, ''); } catch { return 'directo'; }
  if (!h) return 'directo';
  if (h === host.replace(/^www\./, '')) return 'interno';
  if (/(^|\.)google\./.test(h)) return 'google';
  if (/instagram\.com$/.test(h)) return 'instagram';
  if (/(facebook|fb)\.com$|fb\.me$/.test(h)) return 'facebook';
  if (/tiktok\.com$/.test(h)) return 'tiktok';
  if (/bing\.com$/.test(h)) return 'bing';
  if (/(tripadvisor|thefork|eltenedor)\./.test(h)) return h.split('.').slice(-2, -1)[0];
  return h.slice(0, 40);
}

export function dispositivoDe(ua) {
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'movil';
  return 'ordenador';
}

export const esBot = (ua) => !ua || /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|python|curl|wget/i.test(ua);
