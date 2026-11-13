// Pestañas del panel (Reservas · Fidelización · Carta · Estadísticas · Promos). Uso: <nav class="tabs" data-on="reservas"></nav>
(function(){
  var TABS = [['reservas', '/reservas/admin.html', 'RESERVAS'], ['fidelizacion', '/fidelidad/admin.html', 'FIDELIZACIÓN'], ['carta', '/admin/carta.html', 'CARTA'], ['estadisticas', '/admin/estadisticas.html', 'ESTADÍSTICAS'], ['promociones', '/admin/promociones.html', 'PROMOS']];
  var css = document.createElement('style');
  css.textContent = 'nav.tabs{display:grid!important;grid-template-columns:repeat(5,1fr);gap:4px;margin-bottom:22px;padding:4px;border:1px solid var(--linea);border-radius:99px}' +
    'nav.tabs a{text-align:center;padding:13px 4px;border-radius:99px;color:var(--txt);text-decoration:none;font-size:11.5px;font-weight:600;letter-spacing:.12em;transition:background .25s,color .25s}' +
    'nav.tabs a:hover{color:var(--txt-hi)}nav.tabs a.on{background:var(--rojo);color:var(--tinta)}' +
    '@media (max-width:560px){nav.tabs{grid-template-columns:repeat(6,1fr);border-radius:22px}nav.tabs a{grid-column:span 2}nav.tabs a:nth-child(n+4){grid-column:span 3}}';
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
