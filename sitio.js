/* HANAKI BARCELONA · comportamiento común de las páginas interiores (cabecera, menú, horario, apariciones) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  $$('[data-rise]').forEach(el => {
    if (el.querySelector('.ln')) return;
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((l, i) => `<span class="ln" style="--i:${i}"><span>${l.trim()}</span></span>`).join('');
  });

  const px = v => { const m = /^([\d.]+)(vh|vw|px)?$/.exec((v || '').trim()); if (!m) return Infinity; return m[2] === 'vh' ? innerHeight * m[1] / 100 : m[2] === 'vw' ? innerWidth * m[1] / 100 : +m[1]; };
  const fit = () => $$('[data-fit]').forEach(el => {
    const cs = getComputedStyle(el), p = el.parentElement, pcs = getComputedStyle(p);
    const own = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const avail = p.clientWidth - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight) - own;
    el.style.fontSize = '100px';
    const w = el.getBoundingClientRect().width - own, k = parseFloat(cs.getPropertyValue('--fit')) || 1;
    el.style.fontSize = Math.min(100 * avail * k / w, px(cs.getPropertyValue('--fit-max'))).toFixed(1) + 'px';
  });

  /* Abierto / cerrado (hora de Barcelona) */
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
  const T = { m: (+p.hour % 24) * 60 + +p.minute, d: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday) };
  const open = (T.m >= 720 && T.m < 990) || (T.m >= 1200 && T.m < 1410);
  const stTxt = open ? 'Abierto · cierra a las ' + (T.m < 990 ? '16:30' : '23:30') : T.m < 720 ? 'Abrimos a las 12:00' : T.m < 1200 ? 'Abrimos a las 20:00' : 'Abrimos mañana a las 12:00';
  $$('[data-status]').forEach(s => { s.classList.toggle('is-open', open); s.querySelector('b').textContent = stTxt; });
  $$('#week li,[data-week] li').forEach(li => li.classList.toggle('is-today', [...li.parentNode.children].indexOf(li) === T.d));

  /* Apariciones */
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting && e.boundingClientRect.top > 0) return; e.target.classList.add('is-in'); io.unobserve(e.target); }), { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  $$('[data-in],[data-clip],[data-rise],[data-fit]').forEach(el => io.observe(el));

  /* Cabecera, progreso, barra inferior */
  const hdr = $('#hdr'), prog = $('#progress'), dock = $('#dock'), fija = body.hasAttribute('data-cab-fija');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('is-solid', y > 40);
    if (!fija && !body.classList.contains('is-menu')) hdr.classList.toggle('is-hidden', y > 500 && y > lastY + 2 ? true : y < lastY - 2 ? false : hdr.classList.contains('is-hidden'));
    if (prog) prog.style.transform = `scaleX(${clamp(y / Math.max(1, document.documentElement.scrollHeight - innerHeight))})`;
    if (dock) dock.classList.toggle('is-on', y > 300);
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });

  /* Menú móvil */
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = on => { body.classList.toggle('is-menu', on); burger.setAttribute('aria-expanded', on); menu.setAttribute('aria-hidden', !on); if (on) hdr.classList.remove('is-hidden'); };
  burger.addEventListener('click', () => setMenu(!body.classList.contains('is-menu')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));
  $$('.langs').forEach(g => g.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const i = [...g.children].indexOf(b); $$('.langs').forEach(x => [...x.children].forEach((c, j) => c.classList.toggle('on', i === j))); }));

  const layout = () => { fit(); onScroll(); };
  layout(); addEventListener('resize', layout); addEventListener('load', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  if (RM) $$('[data-in],[data-clip],[data-rise],[data-fit]').forEach(el => el.classList.add('is-in'));
})();
