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
  window.HanakiCookies = { get: get, open: function () { open(true); }, accepted: function (k) { var c = get(); return !!(c && c[k]); } };
  // Cualquier elemento con data-cookie-settings reabre el panel
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cookie-settings]');
    if (t) { e.preventDefault(); close(); open(true); }
  });
  var start = function () { document.head.appendChild(css); if (!get()) open(false); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
