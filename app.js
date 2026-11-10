/* HANAKI BARCELONA · rediseño — interacción y animaciones (sin dependencias) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const qs = new URLSearchParams(location.search);
  const body = document.body;

  /* ── Titulares partidos en líneas ── */
  $$('[data-rise]').forEach(el => {
    if (el.querySelector('.ln')) return;
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i)
      .map((l, i) => `<span class="ln" style="--i:${i}"><span>${l.trim()}</span></span>`).join('');
  });

  /* ── Texto que se enciende palabra a palabra ── */
  $$('[data-words]').forEach(el => {
    const wrap = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const f = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(t => {
            if (!t.trim()) { f.append(t); return; }
            const s = document.createElement('span'); s.className = 'w'; s.textContent = t; f.append(s);
          });
          n.replaceWith(f);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(el);
    el._w = $$('.w', el);
    if (RM) el._w.forEach(w => w.classList.add('is-lit'));
  });

  /* ── Titulares que se ajustan al ancho ── */
  const px = (v, el) => {
    const m = /^([\d.]+)(vh|vw|px)?$/.exec((v || '').trim()); if (!m) return Infinity;
    return m[2] === 'vh' ? innerHeight * m[1] / 100 : m[2] === 'vw' ? innerWidth * m[1] / 100 : +m[1];
  };
  const fit = () => $$('[data-fit]').forEach(el => {
    const cs = getComputedStyle(el), p = el.parentElement, pcs = getComputedStyle(p);
    const own = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const avail = p.clientWidth - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight) - own;
    el.style.fontSize = '100px';
    const w = el.getBoundingClientRect().width - own;
    const k = parseFloat(cs.getPropertyValue('--fit')) || 1;
    el.style.fontSize = Math.min(100 * avail * k / w, px(cs.getPropertyValue('--fit-max'))).toFixed(1) + 'px';
  });

  /* ── Estado abierto / cerrado (hora de Barcelona) ── */
  const now = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
    return { m: (+p.hour % 24) * 60 + +p.minute, d: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday) };
  };
  const T = now();
  const open = (T.m >= 720 && T.m < 990) || (T.m >= 1200 && T.m < 1410);
  const stTxt = open ? 'Abierto · cierra a las ' + (T.m < 990 ? '16:30' : '23:30') : T.m < 720 ? 'Abrimos a las 12:00' : T.m < 1200 ? 'Abrimos a las 20:00' : 'Abrimos mañana a las 12:00';
  $$('[data-status]').forEach(s => { s.classList.toggle('is-open', open); s.querySelector('b').textContent = stTxt; });
  $$('[data-status-sub]').forEach(s => s.textContent = 'Todos los días · 12:00–16:30 · 20:00–23:30');
  $$('#week li').forEach((li, i) => li.classList.toggle('is-today', i === T.d));

  /* ── Aparición al entrar en pantalla ── */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting && e.boundingClientRect.top > 0) return;
    e.target.classList.add('is-in'); io.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  const start = () => {
    $$('[data-in],[data-clip],[data-rise],[data-fit]').forEach(el => el.closest('.hero') ? el.classList.add('is-in') : io.observe(el));
    const v = $('.hero video'); if (v) { v.addEventListener('playing', () => v.classList.add('is-on')); v.play().catch(() => {}); }
    setTimeout(runStamps, RM ? 0 : 900);
  };

  /* ── Intro ── */
  const intro = $('#intro');
  const endIntro = () => { intro.classList.add('is-out'); body.classList.remove('is-loading'); start(); setTimeout(() => intro.remove(), 1100); };
  let seen = false; try { seen = sessionStorage.getItem('hk-intro'); sessionStorage.setItem('hk-intro', 1); } catch (e) {}
  if (RM || qs.has('nointro') || seen) { intro.remove(); body.classList.remove('is-loading'); requestAnimationFrame(start); }
  else {
    const n = $('#introN'), t0 = performance.now(), D = 1500;
    const tick = t => { const p = clamp((t - t0) / D); n.textContent = String(Math.round(p * p * (3 - 2 * p) * 100)).padStart(3, '0'); p < 1 ? requestAnimationFrame(tick) : setTimeout(endIntro, 180); };
    requestAnimationFrame(tick);
  }

  /* ── Cabecera, progreso, barra inferior ── */
  const hdr = $('#hdr'), prog = $('#progress'), dock = $('#dock');
  let lastY = scrollY, vel = 0;
  const onScrollUI = y => {
    hdr.classList.toggle('is-solid', y > 40);
    if (!body.classList.contains('is-menu')) hdr.classList.toggle('is-hidden', y > 500 && y > lastY + 2 ? true : y < lastY - 2 ? false : hdr.classList.contains('is-hidden'));
    prog.style.transform = `scaleX(${clamp(y / (document.documentElement.scrollHeight - innerHeight))})`;
    dock.classList.toggle('is-on', y > innerHeight * 0.6);
  };
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) $$('.nav a').forEach(a => a.classList.toggle('is-cur', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['hero', 'precios', 'galeria', 'reservar', 'contacto'].forEach(id => { const el = $('#' + id); el && spy.observe(el); });

  /* ── Menú móvil ── */
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = on => { body.classList.toggle('is-menu', on); burger.setAttribute('aria-expanded', on); menu.setAttribute('aria-hidden', !on); if (on) hdr.classList.remove('is-hidden'); };
  burger.addEventListener('click', () => setMenu(!body.classList.contains('is-menu')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));
  $$('.langs').forEach(g => g.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const i = [...g.children].indexOf(b); $$('.langs').forEach(x => [...x.children].forEach((c, j) => c.classList.toggle('on', i === j))); }));

  /* ── Parallax ── */
  const plx = $$('[data-plx]').map(el => ({ el, k: +el.dataset.plx, host: el.parentElement }));
  const doPlx = () => { if (RM) return; const vh = innerHeight; plx.forEach(o => { const r = o.host.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return; o.el.style.setProperty('--py', ((r.top + r.height / 2 - vh / 2) * -o.k).toFixed(1) + 'px'); }); };

  /* ── Texto encendido ── */
  const doWords = () => { if (RM) return; $$('[data-words]').forEach(el => { const r = el.getBoundingClientRect(), vh = innerHeight; const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3)); const n = Math.round(p * el._w.length * 1.08); el._w.forEach((w, i) => w.classList.toggle('is-lit', i < n)); }); };

  /* ── Cinta ── */
  const tracks = $$('[data-marquee]').map(tr => {
    const base = [...tr.children]; let guard = 0;
    while (tr.scrollWidth < innerWidth * 2.4 && guard++ < 8) base.forEach(n => tr.append(n.cloneNode(true)));
    const unit = tr.scrollWidth / (guard + 1);
    return { tr, unit, x: 0, dir: -1, flat: tr.dataset.marquee === 'flat' };
  });
  const doMarquee = () => tracks.forEach(o => {
    if (RM) return;
    if (o.flat) { if (!o.tr.matches(':hover')) o.x -= 0.7; }
    else { if (Math.abs(vel) > 1) o.dir = vel > 0 ? -1 : 1; o.x += o.dir * (1.1 + Math.min(Math.abs(vel) * 0.35, 26)); }
    if (o.x <= -o.unit) o.x += o.unit; if (o.x > 0) o.x -= o.unit;
    o.tr.style.transform = `translate3d(${o.x.toFixed(1)}px,0,0) skewX(${o.flat ? 0 : clamp(vel * -0.25, -9, 9).toFixed(2)}deg)`;
  });

  /* ── Cómo funciona: la tablet y los dos vídeos del robot pasan solos; se puede elegir paso ── */
  const figs = $$('[data-how-m]'), steps = $$('[data-how]'), howN = $('#howN'), HOW_MS = [4000, 5000, 5000];
  let cur = 0, howT, howOn = false;
  const setHow = i => {
    clearTimeout(howT);
    figs.forEach((f, k) => {
      f.classList.toggle('was', k === cur && k !== i); f.classList.toggle('on', k === i);
      const v = f.querySelector('video'); if (!v) return;
      if (k === i) { try { v.currentTime = 0; } catch (e) {} v.play().catch(() => {}); } else v.pause();
    });
    steps.forEach((s, k) => { s.classList.remove('on'); if (k === i) { s.offsetWidth; s.classList.add('on'); } });
    howN.textContent = '0' + (i + 1); cur = i;
    if (howOn && !RM) howT = setTimeout(() => setHow((i + 1) % figs.length), HOW_MS[i]);
  };
  steps.forEach((s, i) => s.addEventListener('click', () => setHow(i)));
  new IntersectionObserver(es => es.forEach(e => {
    howOn = e.isIntersecting;
    if (howOn) setHow(cur); else { clearTimeout(howT); figs.forEach(f => { const v = f.querySelector('video'); v && v.pause(); }); }
  }), { threshold: 0.3 }).observe($('#como'));

  /* ── Carta: carril horizontal ── */
  const sec = $('#carta'), rail = $('#rail'), track = $('#railTrack'), bar = $('#railBar');
  let pinDist = 0;
  const setupRail = () => {
    const pin = FINE && !RM && innerWidth > 920 && innerHeight >= 620;
    sec.classList.toggle('is-pinned', pin);
    track.style.transform = ''; sec.style.height = '';
    if (pin) { pinDist = track.scrollWidth - innerWidth; sec.style.height = innerHeight + pinDist + 'px'; } else pinDist = 0;
  };
  const doRail = () => {
    if (!pinDist) return;
    const p = clamp(-sec.getBoundingClientRect().top / pinDist);
    track.style.transform = `translate3d(${(-p * pinDist).toFixed(1)}px,0,0)`;
    bar.style.transform = `scaleX(${Math.max(0.06, p)})`;
  };
  rail.addEventListener('scroll', () => { if (pinDist) return; bar.style.transform = `scaleX(${Math.max(0.06, rail.scrollLeft / (rail.scrollWidth - rail.clientWidth))})`; }, { passive: true });

  /* ── Precios ── */
  const sw = $('#switch');
  const setTurno = (t, anim = true) => {
    sw.dataset.on = t;
    $$('button', sw).forEach(b => { const on = b.dataset.turno === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    $$('[data-roll]').forEach((el, i) => {
      const v = el.dataset[t]; if (el.textContent === v) return;
      if (!anim || RM) { el.textContent = v; return; }
      setTimeout(() => {
        el.classList.add('out-up');
        setTimeout(() => { el.textContent = v; el.classList.remove('out-up'); el.classList.add('in-dn'); el.offsetWidth; el.classList.remove('in-dn'); }, 260);
      }, i * 70);
    });
  };
  sw.addEventListener('click', e => { const b = e.target.closest('button'); b && setTurno(b.dataset.turno); });
  setTurno(qs.get('turno') || (T.d < 5 && T.m < 1020 ? 'mid' : 'night'), false);

  /* ── Reseñas ── */
  const stage = $('#revStage'), quotes = $$('blockquote', stage), dots = $$('#revDots button');
  let rv = 0, rvT;
  const sizeRev = () => stage.style.height = Math.max(...quotes.map(q => q.offsetHeight)) + 'px';
  const setRev = i => { rv = (i + quotes.length) % quotes.length; quotes.forEach((q, j) => q.classList.toggle('on', j === rv)); dots.forEach((d, j) => d.classList.toggle('on', j === rv)); clearTimeout(rvT); if (!RM) rvT = setTimeout(() => setRev(rv + 1), 7000); };
  dots.forEach((d, i) => d.addEventListener('click', () => setRev(i)));
  setRev(0);

  /* ── Tarjeta: los nigiris se van estampando ── */
  function runStamps() {
    const li = $$('#stamps li'), n = $('#stampN');
    li.forEach((s, i) => setTimeout(() => { s.classList.add('on'); n.textContent = (i + 1) + ' / 8'; }, RM ? 0 : i * 210));
  }

  /* ── Botones magnéticos y cursor ── */
  if (FINE && !RM) {
    $$('[data-magnet]').forEach(b => {
      b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .32}px)`; });
      b.addEventListener('mouseleave', () => b.style.transform = '');
    });
    const c = $('#cursor'), lab = c.firstElementChild; let cx = 0, cy = 0, tx = 0, ty = 0;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; c.classList.add('is-on'); const h = e.target.closest && e.target.closest('[data-cursor]'); c.classList.toggle('is-big', !!h); if (h) lab.textContent = h.dataset.cursor; }, { passive: true });
    document.addEventListener('mouseleave', () => c.classList.remove('is-on'));
    const follow = () => { cx += (tx - cx) * .2; cy += (ty - cy) * .2; c.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`; requestAnimationFrame(follow); };
    follow();
  }

  /* ── Bucle ── */
  const frame = () => {
    const y = scrollY; vel += ((y - lastY) - vel) * 0.2;
    if (y !== lastY) { onScrollUI(y); doPlx(); doWords(); doRail(); }
    doMarquee(); lastY = y; requestAnimationFrame(frame);
  };
  const layout = () => { fit(); setupRail(); sizeRev(); onScrollUI(scrollY); doPlx(); doWords(); doRail(); };
  layout(); requestAnimationFrame(frame);
  addEventListener('resize', layout);
  addEventListener('load', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
})();
