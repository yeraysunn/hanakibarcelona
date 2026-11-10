// Pestañas del panel (Reservas · Fidelización · Carta · Estadísticas). Uso: <nav class="tabs" data-on="reservas"></nav>
(function(){
  var TABS = [['reservas', '/reservas/admin.html', 'RESERVAS'], ['fidelizacion', '/fidelidad/admin.html', 'FIDELIZACIÓN'], ['carta', '/admin/carta.html', 'CARTA'], ['estadisticas', '/admin/estadisticas.html', 'ESTADÍSTICAS']];
  var css = document.createElement('style');
  css.textContent = 'nav.tabs{display:grid!important;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px}' +
    'nav.tabs a{text-align:center;padding:12px 4px;border:1px solid var(--linea);color:var(--txt);text-decoration:none;font-size:11px;font-weight:600;letter-spacing:.14em}' +
    'nav.tabs a.on{border-color:var(--oro);color:var(--oro)}' +
    '@media (max-width:560px){nav.tabs{grid-template-columns:1fr 1fr}}';
  document.head.appendChild(css);
  function pintar(){
    document.querySelectorAll('nav.tabs[data-on]').forEach(function(nav){
      var tr = window.T || function(s){ return s; };
      nav.innerHTML = TABS.map(function(t){
        var on = t[0] === nav.dataset.on;
        return '<a href="' + t[1] + '"' + (on ? ' class="on" aria-current="page"' : '') + '>' + tr(t[2]) + '</a>';
      }).join('');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pintar); else pintar();
})();
