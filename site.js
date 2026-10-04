(function () {
  // Forzar HTTPS (respaldo cliente; el servidor también redirige vía .htaccess)
  var h = location.hostname;
  if (location.protocol === 'http:' && h && !/^(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.)/.test(h)) {
    location.replace('https:' + location.href.slice(5));
    return;
  }
  if (window.HanakiCookies) return;
  var KEY = 'hanaki-consent';
  var get = function () { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  var save = function (a, x) {
    var c = { v: 1, necesarias: true, analiticas: !!a, externas: !!x, fecha: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    window.dispatchEvent(new CustomEvent('hanaki-consent', { detail: c }));
    close();
  };
  var el, css = document.createElement('style');
  css.textContent = '#hk-ck{position:fixed;z-index:95;left:16px;bottom:16px;max-width:440px;width:calc(100% - 32px);background:#141414;color:#F3EEE6;border:1px solid rgba(201,164,92,.35);box-shadow:0 24px 60px rgba(0,0,0,.55);padding:22px 22px 20px;min-height:0!important;height:auto!important;max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;font-family:"DM Sans",sans-serif;display:flex;flex-direction:column;gap:14px}' +
    '@media(max-width:1179px){#hk-ck{bottom:calc(88px + env(safe-area-inset-bottom));max-height:calc(100vh - 104px - env(safe-area-inset-bottom));max-height:calc(100dvh - 104px - env(safe-area-inset-bottom))}}body>div#hk-ck,#hk-ck{min-height:0!important;height:auto!important}' +
    '#hk-ck h2{margin:0;font-family:"Cormorant Garamond",serif;font-weight:500;font-size:24px;letter-spacing:.08em}' +
    '#hk-ck p{margin:0;font-size:13.5px;line-height:1.6;color:#BDB6AB}#hk-ck a{color:#C9A45C;border-bottom:1px solid rgba(201,164,92,.5)}#hk-ck a:hover{color:#F3EEE6}' +
    '#hk-ck .r{display:flex;flex-wrap:wrap;gap:8px}#hk-ck button{font-family:inherit;cursor:pointer;font-size:11px;font-weight:600;letter-spacing:.18em;padding:13px 16px;flex:1 1 auto;border:1px solid rgba(243,238,230,.35);background:none;color:#F3EEE6}' +
    '#hk-ck button:hover{border-color:#C9A45C;color:#C9A45C}#hk-ck button.p{background:#7A1C1C;border-color:#7A1C1C;color:#F3EEE6}#hk-ck button.p:hover{background:#B3261E;border-color:#B3261E;color:#F3EEE6}' +
    '#hk-ck button:focus-visible,#hk-ck input:focus-visible{outline:2px solid #C9A45C;outline-offset:2px}' +
    '#hk-ck .o{display:none;flex-direction:column;gap:2px;border-top:1px solid rgba(243,238,230,.12)}#hk-ck.cfg .o{display:flex}#hk-ck.cfg .bc{display:none}#hk-ck .bs{display:none}#hk-ck.cfg .bs{display:block}' +
    '#hk-ck label{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid rgba(243,238,230,.12);font-size:13px;line-height:1.5;color:#BDB6AB;cursor:pointer}#hk-ck label b{display:block;color:#F3EEE6;font-weight:600;font-size:13.5px}' +
    '#hk-ck input{accent-color:#7A1C1C;width:18px;height:18px;margin-top:2px;flex:none}';
  function close() { if (el) { el.remove(); el = null; } }
  function open(cfg) {
    if (el) return;
    var c = get() || {};
    el = document.createElement('div');
    el.id = 'hk-ck'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Cookies');
    el.innerHTML = '<h2>Usamos cookies</h2>' +
      '<p>Usamos cookies propias necesarias para que la web funcione y, con tu permiso, cookies de terceros (Google Maps, redes sociales) y de análisis. Más información en la <a href="Hanaki%20Legal.dc.html#cookies">política de cookies</a>.</p>' +
      '<div class="o">' +
      '<label><input type="checkbox" checked disabled><span><b>Necesarias</b>Idioma, reseñas y tus preferencias de cookies. Siempre activas.</span></label>' +
      '<label><input type="checkbox" data-k="externas"' + (c.externas ? ' checked' : '') + '><span><b>Contenido de terceros</b>Mapa de Google, WhatsApp y redes sociales.</span></label>' +
      '<label><input type="checkbox" data-k="analiticas"' + (c.analiticas ? ' checked' : '') + '><span><b>Análisis</b>Estadísticas anónimas de visitas para mejorar la web.</span></label>' +
      '</div>' +
      '<div class="r"><button type="button" data-a="no">RECHAZAR</button><button type="button" class="bc" data-a="cfg">CONFIGURAR</button><button type="button" class="bs" data-a="save">GUARDAR</button><button type="button" class="p" data-a="si">ACEPTAR TODAS</button></div>';
    if (cfg) el.classList.add('cfg');
    el.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('button') && e.target.closest('button').getAttribute('data-a');
      if (a === 'si') save(true, true);
      else if (a === 'no') save(false, false);
      else if (a === 'cfg') el.classList.add('cfg');
      else if (a === 'save') save(el.querySelector('[data-k=analiticas]').checked, el.querySelector('[data-k=externas]').checked);
    });
    document.body.appendChild(el);
  }
  // Analítica: pon aquí tu ID de Google Analytics 4 (G-XXXXXXX). Solo se carga si el usuario acepta "Análisis".
  var GA_ID = '';
  var ga = function () { if (!GA_ID || window.__hkGa || !(get() || {}).analiticas) return; window.__hkGa = 1; var sc = document.createElement('script'); sc.async = true; sc.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID; document.head.appendChild(sc); window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); }; gtag('js', new Date()); gtag('config', GA_ID, { anonymize_ip: true }); };
  window.addEventListener('hanaki-consent', ga);
  // Iframes de terceros (mapa de Google): usan data-consent-src en vez de src y solo cargan con consentimiento
  // "externas" o si el usuario pulsa "Ver mapa" en el aviso que se muestra dentro del propio iframe.
  var TXT = {
    es: ['Mapa de Google', 'Al cargarlo, Google puede usar cookies.', 'VER MAPA'],
    ca: ['Mapa de Google', 'En carregar-lo, Google pot fer servir galetes.', 'VEURE MAPA'],
    en: ['Google Map', 'Loading it lets Google use cookies.', 'SHOW MAP'],
    fr: ['Carte Google', 'En la chargeant, Google peut utiliser des cookies.', 'VOIR LA CARTE']
  };
  var aviso = function () {
    var l; try { l = (localStorage.getItem('hanaki-bcn-lang') || document.documentElement.lang || 'es').slice(0, 2).toLowerCase(); } catch (e) { l = 'es'; }
    var t = TXT[l] || TXT.es;
    // Colores claros a propósito: el iframe del mapa lleva un filtro gris+invertido que lo deja oscuro
    return '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;height:100%}body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:10px;box-sizing:border-box;background:#ECE8E2;color:#4A4A4A;font:12px/1.4 "DM Sans",system-ui,sans-serif;text-align:center}b{color:#0C0C0C;font-weight:600;font-size:13px}button{font:inherit;font-size:11px;font-weight:600;letter-spacing:.18em;padding:9px 16px;background:none;color:#0C0C0C;border:1px solid rgba(12,12,12,.4);cursor:pointer}button:hover{border-color:#0C0C0C;background:rgba(12,12,12,.06)}@media(min-height:300px){body{justify-content:flex-end;padding-bottom:18%}}</style>' +
      '<b>' + t[0] + '</b><span>' + t[1] + '</span><button type="button" onclick="parent.HanakiCookies.loadFrame()">' + t[2] + '</button>';
  };
  var permitido = false; // el usuario pulsó "Ver mapa" en esta página
  var gateFrames = function () {
    var ok = permitido || (get() || {}).externas;
    document.querySelectorAll('iframe[data-consent-src]').forEach(function (f) {
      if (ok) {
        if (f.getAttribute('src') === f.dataset.consentSrc) return;
        f.removeAttribute('srcdoc'); f.src = f.dataset.consentSrc;
      } else if (!f.hasAttribute('srcdoc')) {
        f.srcdoc = aviso();
      }
    });
  };
  window.addEventListener('hanaki-consent', gateFrames);

  window.HanakiCookies = { get: get, open: function () { open(true); }, accepted: function (k) { var c = get(); return !!(c && c[k]); }, loadFrame: function () { permitido = true; gateFrames(); } };
  // Cualquier elemento con data-cookie-settings reabre el panel
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cookie-settings]');
    if (t) { e.preventDefault(); close(); open(true); }
  });
  var start = function () {
    document.head.appendChild(css); if (!get()) open(false); else ga();
    // La web se renderiza por plantillas que crean y repintan los iframes: vigilar el DOM y sus atributos
    gateFrames(); new MutationObserver(gateFrames).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcdoc', 'data-consent-src'] });
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
