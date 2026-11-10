// Estadísticas de Hanaki sin cookies: cuenta visitas y clics importantes (llamar, WhatsApp, cómo llegar, reservar).
// No usa cookies ni localStorage, así que no necesita el aviso de cookies. Los datos se ven en /admin/estadisticas.html
(function () {
  if (window.HK_STATS || navigator.webdriver) return;
  function enviar(e) {
    try {
      var q = new URLSearchParams(location.search);
      var d = JSON.stringify({ p: location.pathname, r: document.referrer, u: q.get('utm_source') || '', e: e || 'vista' });
      if (!(navigator.sendBeacon && navigator.sendBeacon('/api/visita', new Blob([d], { type: 'application/json' })))) {
        fetch('/api/visita', { method: 'POST', body: d, keepalive: true, headers: { 'content-type': 'application/json' } });
      }
    } catch (x) {}
  }
  window.HK_STATS = { evento: enviar };
  enviar();

  // Clics que interesan al restaurante
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    var e = /^tel:/.test(h) ? 'llamar'
      : /wa\.me|whatsapp/i.test(h) ? 'whatsapp'
      : /google\.[^/]+\/maps\/dir|maps\.apple|maps\?daddr|\/maps\/place/i.test(h) ? 'como_llegar'
      : /^\/?reservas\/?($|[?#])|\/reservas\/$/.test(h) && !/admin/.test(h) ? 'reservar'
      : /^\/fidelidad\/?($|[?#])/.test(h) ? 'tarjeta'
      : /instagram\.com/i.test(h) ? 'instagram'
      : null;
    if (e) enviar(e);
  }, true);
})();
