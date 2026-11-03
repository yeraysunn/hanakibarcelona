// Configuración de la tarjeta de fidelidad Hanaki
window.HK_FID = {
  sello: 'sello.png',            // imagen del sello (ilustración de sushi)
  objetivo: 8,                   // sellos para el premio (debe coincidir con SELLOS_PREMIO en functions/api/fidelidad/_lib.js)
  premio: 'Buffet gratis',
};

// Guarda la tarjeta del cliente en este móvil (localStorage + cookie de 400 días, por si una de las dos se borra)
window.HK_TOKEN = {
  leer: function () {
    var t = null;
    try { t = localStorage.getItem('hk-fid-token'); } catch (e) {}
    if (!t) { var m = document.cookie.match(/(?:^|; )hk_fid_t=([a-f0-9]{32})/); if (m) t = m[1]; }
    return t;
  },
  guardar: function (t) {
    if (!/^[a-f0-9]{32}$/.test(t || '')) return;
    try { localStorage.setItem('hk-fid-token', t); } catch (e) {}
    document.cookie = 'hk_fid_t=' + t + '; Path=/fidelidad; Max-Age=34560000; SameSite=Lax; Secure';
  },
  borrar: function () {
    try { localStorage.removeItem('hk-fid-token'); } catch (e) {}
    document.cookie = 'hk_fid_t=; Path=/fidelidad; Max-Age=0; SameSite=Lax; Secure';
  },
};
