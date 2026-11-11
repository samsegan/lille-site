/* LILLE: the page's motion and its player.
   Everything on screen is placed from one number per pinned run: how far the
   reader has scrolled through it, counted in screen heights. */
(() => {
  'use strict';
  const html = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const out3 = (t) => 1 - Math.pow(1 - t, 3);
  const io = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const back = (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);
  const D = window.LILLE || { tracks: {} };

  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const handheld = matchMedia('(hover: none), (pointer: coarse)').matches;
  const narrow = matchMedia('(max-width: 820px) and (orientation: portrait)');
  const go = !calm;
  if (go) html.classList.add('go');

  // ---------- the timeline, in screen heights ----------
  const RUN_LEN = 13.2, END_LEN = 3.6;                    // + 1 screen each = the heights in the stylesheet
  const CARD0 = 3.15, CARD_STEP = 0.72, CARD_FLY = 0.6;   // when the first record card lands, and the rhythm after it
  const FLAT = [7.7, 8.5], CIRCLE = [8.6, 9.6], QUOTES = [9.75, 12.1], STREAK = [12.2, 13.2];
  const ARCH = [2.0, 3.0];

  const el = {
    run: $('#run'), end: $('#end'), hero: $('.hero'), board: $('#board'),
    track: $('#track'), title: $('#song-title'), tag: $('#song-tag'), media: $('#media'), links: $$('#stream li'), stream: $('#stream'),
    tilt: $('#tilt'), cards: $$('#deck .card'), index: $('#index'),
    about: $('#about'), streaks: $('#streaks'), bands: $$('#streaks i'),
    nights: $('#live'), letters: $$('#nights-title span'), sub: $('#nights-sub'), nightRow: $('#night-row'), night: $$('.night'),
    contact: $('#contact'),
  };
  const M = { W: 0, H: 0, runTop: 0, runU: 1, endTop: 0, endU: 1, shift: 0, slide: 0 };

  function measure() {
    M.W = html.clientWidth; M.H = window.innerHeight;
    if (!go) return;
    M.runTop = el.run.offsetTop; M.runU = el.run.offsetHeight / (RUN_LEN + 1);
    M.endTop = el.end.offsetTop; M.endU = el.end.offsetHeight / (END_LEN + 1);
    // the single's picture starts alone in the middle, then steps aside for the links
    M.shift = narrow.matches ? 0 : (el.stream.offsetWidth + parseFloat(getComputedStyle($('#song-row')).columnGap || 0)) / 2;
    const n = el.night[0];
    M.slide = n ? n.offsetWidth + M.W * 0.06 : 0;
  }

  // ---------- record index (wide screens) ----------
  el.index.innerHTML = el.cards.map((c, i) => ({ c, i })).reverse().map(({ c, i }, k) =>
    `<li><button type="button" data-card="${i}"><i>${String(k + 1).padStart(2, '0')}</i>${$('h3', c).childNodes[0].textContent.trim()} <em>${$('.yr', c).textContent}</em></button></li>`).join('');
  const indexBtns = $$('button', el.index);
  const cardMoment = (i) => M.runTop + (CARD0 + i * CARD_STEP + CARD_FLY + 0.04) * M.runU;
  el.index.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-card]');
    if (b) window.scrollTo({ top: cardMoment(+b.dataset.card), behavior: 'smooth' });
  });
  // a card lying under newer ones: a click brings it back to the top of the pile
  el.cards.forEach((c, i) => c.addEventListener('click', (e) => {
    if (!go || !c.classList.contains('under')) return;
    e.preventDefault(); e.stopPropagation();
    window.scrollTo({ top: cardMoment(i), behavior: 'smooth' });
  }, true));

  // ---------- drawing one moment ----------
  const set = (node, prop, v) => { if (node.__s === undefined) node.__s = {}; if (node.__s[prop] !== v) { node.__s[prop] = v; node.style[prop] = v; } };
  const order = [4, 1, 7, 0, 5, 2, 8, 3, 6];   // which light streak leads
  let lastTop = -1, scrollQ = -2;

  function draw(sy) {
    const pr = (sy - M.runTop) / M.runU, pe = (sy - M.endTop) / M.endU;
    const phone = narrow.matches;

    // landing: the wall grows a little as the dark screen slides over it
    const z = seg(pr, -1, 0);
    set(el.hero, 'visibility', pr > 0.03 ? 'hidden' : 'visible');
    if (pr <= 0.03) { el.board.style.setProperty('--zoom', (1 + 0.1 * z).toFixed(4)); el.board.style.setProperty('--wordy', (-5 * z).toFixed(2) + '%'); }

    // new single
    const songOn = pr > -1.05 && pr < 3.35;
    if (songOn) {
      const tt = out3(seg(pr, -0.55, 0.75));
      set(el.title, 'transform', `translate3d(0,${((1 - tt) * 0.3 * M.H).toFixed(1)}px,0)`);
      set(el.tag, 'opacity', seg(pr, 0.35, 0.8).toFixed(3));
      const m = out3(seg(pr, 0.45, 1.25)), l = seg(pr, 1.15, 1.9);
      set(el.media, 'transform', `translate3d(${((1 - out3(l)) * M.shift).toFixed(1)}px,${((1 - m) * 0.7 * M.H).toFixed(1)}px,0) scale(${(0.86 + 0.14 * m).toFixed(4)})`);
      set(el.media, 'opacity', Math.min(1, m * 1.6).toFixed(3));
      el.links.forEach((li, i) => {
        const t = out3(clamp(l * 1.75 - i * 0.25));
        set(li, 'opacity', t.toFixed(3));
        set(li, 'transform', `translate3d(${((1 - t) * 44).toFixed(1)}px,0,0)`);
      });
    }

    // sideways into the discography
    const w = io(seg(pr, 2.3, 3.3));
    set(el.track, 'transform', `translate3d(${(-w * 100).toFixed(3)}%,0,0)`);
    const aboutC = seg(pr, CIRCLE[0], CIRCLE[1]);
    set(el.track, 'visibility', aboutC >= 1 ? 'hidden' : 'visible');

    if (pr > 2.2 && aboutC < 1) {
      const lean = phone ? 0 : 1 - io(seg(pr, FLAT[0], FLAT[1]));
      set(el.tilt, 'transform', lean ? `rotateX(${(52 * lean).toFixed(2)}deg) rotateZ(${(10 * lean).toFixed(2)}deg)` : 'none');
      const n = el.cards.length, e = [];
      for (let i = 0; i < n; i++) e[i] = out3(seg(pr, CARD0 + i * CARD_STEP, CARD0 + i * CARD_STEP + CARD_FLY));
      const cap = phone ? 3 : 4, step = phone ? 26 : 15;
      let depth = 0, top = -1;
      for (let i = n - 1; i >= 0; i--) {
        const c = el.cards[i], d = Math.min(depth, cap);
        if (e[i] <= 0) { set(c, 'visibility', 'hidden'); } else {
          const x = phone ? 0 : (1 - e[i]) * -0.6 * M.W, y = (1 - e[i]) * (phone ? 1.0 : 0.95) * M.H - d * step;
          set(c, 'visibility', 'visible');
          set(c, 'transform', `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${phone ? 0 : (i + 1) * 5}px) rotate(${((1 - e[i]) * (phone ? 0 : -14)).toFixed(2)}deg) scale(${(1 - d * (phone ? 0.018 : 0.012)).toFixed(4)})`);
          if (top < 0 && e[i] > 0.5) top = i;
        }
        c.classList.toggle('under', depth > 0.5);
        depth += e[i];
      }
      if (top !== lastTop) { lastTop = top; indexBtns.forEach((b) => b.classList.toggle('on', +b.dataset.card === top)); }
    }

    // about opens as a growing black circle
    set(el.about, 'visibility', aboutC > 0 && pr < RUN_LEN + 1.05 ? 'visible' : 'hidden');
    if (aboutC > 0) set(el.about, 'clipPath', aboutC >= 1 ? 'none' : `circle(${(Math.pow(aboutC, 1.5) * 130).toFixed(2)}vmax at 50% 64%)`);
    const q = Math.floor(seg(pr, QUOTES[0], QUOTES[1]) * (quotes.length + 0.999)) - 1;
    if (q !== scrollQ) { scrollQ = q; if (aboutC > 0 || q >= 0) showQuote(clamp(q, -1, quotes.length - 1)); }

    // light streaks wipe the screen to paper
    const s = seg(pr, STREAK[0], STREAK[1]);
    set(el.streaks, 'visibility', s > 0 && pr < RUN_LEN + 1.05 ? 'visible' : 'hidden');
    if (s > 0) el.bands.forEach((b, i) => set(b, 'transform', `translate3d(${(-180 * (1 - out3(clamp(s * 1.5 - order[i] * 0.055)))).toFixed(2)}%,0,0)`));

    // nights
    if (pe > -1.05) {
      el.letters.forEach((sp, j) => {
        const t = seg(pe, -0.62 + j * 0.035, -0.2 + j * 0.035);
        set(sp, 'transform', t >= 1 ? 'none' : `translate3d(0,${(-(1 - back(t)) * 120).toFixed(1)}%,0) rotate(${((1 - t) * -16).toFixed(1)}deg)`);
        set(sp, 'opacity', Math.min(1, t * 4).toFixed(2));
      });
      set(el.sub, 'opacity', seg(pe, -0.15, 0.15).toFixed(3));
      if (phone) {
        const t0 = out3(seg(pe, -0.35, 0.25));
        el.night.forEach((nn) => { set(nn, 'transform', `translate3d(0,${((1 - t0) * 0.3 * M.H).toFixed(1)}px,0)`); set(nn, 'opacity', t0.toFixed(3)); });
        el.nightRow.style.setProperty('--slide', (-io(seg(pe, 0.4, 1.75)) * 2 * M.slide).toFixed(1) + 'px');
      } else {
        const from = [[-0.75, 0.25, -11], [0, 0.95, 5], [0.75, 0.25, 11]];
        el.night.forEach((nn, i) => {
          const t = out3(seg(pe, -0.1 + i * 0.16, 0.7 + i * 0.16)), f = from[i] || from[1];
          set(nn, 'transform', t >= 1 ? 'none' : `translate3d(${(f[0] * (1 - t) * M.W).toFixed(1)}px,${(f[1] * (1 - t) * M.H).toFixed(1)}px,0) rotate(${(f[2] * (1 - t)).toFixed(2)}deg)`);
          set(nn, 'opacity', Math.min(1, t * 3).toFixed(3));
        });
      }
      // contact rises as a dark dome from the bottom edge
      const a = seg(pe, ARCH[0], ARCH[1]);
      set(el.contact, 'visibility', a > 0 ? 'visible' : 'hidden');
      if (a > 0) set(el.contact, 'clipPath', a >= 1 ? 'none' : `circle(${(a * 190).toFixed(2)}vmax at 50% ${(100 + 55 * a + 12).toFixed(1)}%)`);
      set(el.nights, 'visibility', a >= 1 ? 'hidden' : 'visible');
    }
  }

  // ---------- about: the lines in the speech bubble ----------
  const quotes = $$('#quotes li').map((li) => ({ text: li.textContent.trim(), src: li.dataset.src || '' }));
  const bubble = $('#bubble'), bubbleText = $('#bubble-text'), bubbleSrc = $('#bubble-src');
  let quoteAt = -1;
  function showQuote(i) {
    if (i === quoteAt) return;
    quoteAt = i;
    bubbleText.textContent = i < 0 ? 'pull a curl…' : `“${quotes[i].text}”`;
    bubbleSrc.textContent = i < 0 ? '' : quotes[i].src;
    bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
  }
  const nextQuote = () => showQuote((quoteAt + 1) % quotes.length);

  // the drawing: the eyes follow the pointer, the three loose curls can be pulled
  const avatar = $('#avatar');
  if (avatar) {
    const pupils = $$('.pupil', avatar);
    const look = (cx, cy) => {
      const b = avatar.getBoundingClientRect();
      if (!b.width) return;
      const dx = clamp((cx - (b.left + b.width / 2)) / (M.W / 2), -1, 1), dy = clamp((cy - (b.top + b.height * 0.5)) / (M.H / 2), -1, 1);
      pupils.forEach((p) => { p.style.transform = `translate(${(dx * 5.5).toFixed(2)}px,${(dy * 3.2 + 0.6).toFixed(2)}px)`; });
    };
    window.addEventListener('pointermove', (e) => look(e.clientX, e.clientY), { passive: true });
    $$('.pull', avatar).forEach((g) => {
      let y0 = 0, pulled = 0, raf = 0;
      const unit = () => 360 / (avatar.getBoundingClientRect().width || 360);
      const stretch = (s) => { g.style.transform = `scaleY(${s.toFixed(4)})`; };
      const release = () => {
        const from = pulled, t0 = performance.now();
        cancelAnimationFrame(raf);
        const tick = (now) => {
          const t = (now - t0) / 1000;
          stretch(1 + from * Math.exp(-5.5 * t) * Math.cos(21 * t));
          if (t < 1.1) raf = requestAnimationFrame(tick); else stretch(1);
        };
        raf = requestAnimationFrame(tick);
      };
      g.style.touchAction = 'none';
      g.addEventListener('pointerdown', (e) => { e.preventDefault(); cancelAnimationFrame(raf); y0 = e.clientY; pulled = 0; g.classList.add('held'); g.setPointerCapture(e.pointerId); });
      g.addEventListener('pointermove', (e) => { if (!g.classList.contains('held')) return; pulled = clamp((e.clientY - y0) * unit() / 46, 0, 1.5); stretch(1 + pulled); });
      const up = () => {
        if (!g.classList.contains('held')) return;
        g.classList.remove('held');
        if (pulled < 0.12) pulled = 0.45;       // a plain click or tap tugs it too
        release(); nextQuote();
      };
      g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    });
    avatar.setAttribute('tabindex', '0');
    avatar.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextQuote(); } });
  }

  // ---------- scroll loop ----------
  let sy = window.scrollY, ticking = false;
  const ease = handheld ? 1 : 0.16;
  function frame() {
    const target = window.scrollY;
    sy += (target - sy) * ease;
    if (Math.abs(target - sy) < 0.4) sy = target;
    draw(sy);
    if (sy !== target) requestAnimationFrame(frame); else ticking = false;
  }
  const kick = () => { if (go && !ticking) { ticking = true; requestAnimationFrame(frame); } };
  if (go) {
    measure(); draw(sy);
    window.addEventListener('scroll', kick, { passive: true });
    let rt = 0;
    const again = () => { measure(); sy = window.scrollY; draw(sy); };
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(again, 80); });
    window.addEventListener('load', again);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(again);
  } else {
    showQuote(-1);
  }

  // ---------- menu and section links ----------
  const spots = {
    top: () => 0,
    song: () => M.runTop + 2.0 * M.runU,
    music: () => cardMoment(4),
    about: () => M.runTop + (QUOTES[0] - 0.02) * M.runU,
    live: () => M.endTop + (narrow.matches ? 0.36 : 1.2) * M.endU,
    contact: () => M.endTop + (ARCH[1] + 0.3) * M.endU,
  };
  const anchors = { top: '#top', song: '#song', music: '#music', about: '#about', live: '#live', contact: '#contact' };
  function jump(name, smooth) {
    if (!go) { const t = $(anchors[name]); if (t) t.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' }); return; }
    measure();
    window.scrollTo({ top: spots[name](), behavior: smooth ? 'smooth' : 'instant' });
    sy = window.scrollY; draw(sy);
  }
  const menu = $('#menu'), burger = $('#burger');
  let menuTimer = 0;
  function setMenu(open) {
    clearTimeout(menuTimer);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close the menu' : 'Menu');
    if (open) { menu.hidden = false; void menu.offsetWidth; html.classList.add('menu-open'); }
    else { html.classList.remove('menu-open'); menuTimer = setTimeout(() => { menu.hidden = true; }, calm ? 0 : 720); }
  }
  burger.addEventListener('click', () => setMenu(!html.classList.contains('menu-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && html.classList.contains('menu-open')) setMenu(false); });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-go]');
    if (!a) return;
    e.preventDefault();
    const inMenu = !!a.closest('#menu');
    jump(a.dataset.go, !inMenu && a.dataset.go === 'top' && window.scrollY < M.H * 3);
    if (inMenu) setMenu(false);
    history.replaceState(null, '', a.dataset.go === 'top' ? location.pathname : '#' + a.dataset.go);
  });
  const fromHash = () => { const k = location.hash.slice(1); if (spots[k] && k !== 'top') jump(k, false); };
  window.addEventListener('load', () => setTimeout(fromHash, 60));

  // ---------- loader ----------
  const loader = $('#loader');
  if (loader) {
    const n = $('#loader-n'), word = $('#loader-word'), img = $('.hero-bg img');
    const t0 = performance.now(), least = calm ? 0 : 650, most = 2200;
    const ready = () => img.complete && img.naturalWidth > 0;
    const tick = (now) => {
      const t = now - t0, p = Math.min(1, t / least || 1);
      const shown = ready() || t > most ? p : Math.min(p, 0.9);
      n.textContent = Math.round(shown * 100) + '%';
      if (shown < 1) return requestAnimationFrame(tick);
      word.textContent = 'Activated.'; n.textContent = '';
      setTimeout(() => { loader.classList.add('done'); setTimeout(() => loader.remove(), 800); }, calm ? 0 : 260);
    };
    requestAnimationFrame(tick);
  }

  // ---------- pointer ring ----------
  const cur = $('#cur');
  if (cur && go && !handheld) {
    window.addEventListener('pointermove', (e) => {
      cur.classList.add('on');
      cur.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
      cur.classList.toggle('big', !!e.target.closest('a, button, .pull, .card.under, [role="slider"]'));
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
  }

  // ---------- toast, and the address copies on click (computers) ----------
  const toast = $('#toast');
  let toastTimer = 0;
  const say = (text) => { toast.textContent = text; toast.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('on'), 1900); };
  const mail = $('#mail');
  if (mail) mail.addEventListener('click', (e) => {
    if (handheld || !navigator.clipboard) return;       // phones: the link opens the mail app
    e.preventDefault();
    navigator.clipboard.writeText(mail.getAttribute('href').replace('mailto:', '')).then(() => say('Address copied'), () => { location.href = mail.href; });
  });

  // ---------- player: SoundCloud's own widget, the page's controls (wide screens) ----------
  // Phones and tablets: Play opens SoundCloud itself (its embedded player needs several taps there).
  const wide = matchMedia('(min-width: 821px)');
  const inDock = () => wide.matches && !handheld;
  const docks = (r) => !!(r && r.sc && r.embed !== false && inDock());
  const clock = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const dock = { el: $('#dock'), widget: null, frame: null, dur: 0, id: null, started: false, on: false, wait: 0 };

  // Opens SoundCloud in a new tab; where a browser refuses new tabs (some in-app browsers), in this one.
  function leave(url) {
    const w = window.open(url, '_blank');
    if (w) { try { w.opener = null; } catch (e) { /* another origin already */ } } else { location.href = url; }
  }
  function play(id) {
    const r = D.tracks[id];
    if (!r) return;
    if (!docks(r)) { leave(r.sc); return; }
    if (dock.id === id && dock.widget && !dock.el.hidden) { dock.widget.toggle(); return; }
    loadSC().then(() => start(id, r)).catch(() => leave(r.sc));
  }
  let scLoading = null;
  function loadSC() {
    if (window.SC && window.SC.Widget) return Promise.resolve();
    if (!scLoading) scLoading = new Promise((ok, no) => {
      const s = document.createElement('script');
      s.src = 'https://w.soundcloud.com/player/api.js'; s.onload = ok; s.onerror = no;
      document.head.appendChild(s);
    });
    return scLoading;
  }
  const mark = () => $$('[data-play]').forEach((b) => b.classList.toggle('playing', !!(dock.on && b.dataset.play === dock.id)));
  const paused = (p) => { dock.on = !p; $('#dock-play').classList.toggle('paused', p); mark(); };
  function start(id, r) {
    $('#dock-title').textContent = r.by === 'LILLE' ? r.title : `${r.title}  ·  ${r.by}`;
    $('#dock-art').src = r.art;
    $('#dock-out').href = r.sc;
    $('#dock-time').textContent = 'Loading';
    $('#dock-fill').style.width = '0';
    dock.el.hidden = false;
    html.style.setProperty('--dock', dock.el.offsetHeight + 'px');
    dock.id = id; dock.started = false; dock.dur = 0;
    const opts = { auto_play: true, show_artwork: false, show_comments: false, visual: false };
    if (!dock.frame) {
      const src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(r.sc) + '&auto_play=true&show_artwork=false&show_comments=false&visual=false';
      dock.frame = Object.assign(document.createElement('iframe'), { className: 'sc-frame', allow: 'autoplay; encrypted-media', title: 'SoundCloud player', src });
      dock.tap.appendChild(dock.frame);
      dock.widget = window.SC.Widget(dock.frame);
      const E = window.SC.Widget.Events;
      dock.widget.bind(E.READY, () => { dock.widget.getDuration((ms) => { dock.dur = ms; }); expectSound(); });
      dock.widget.bind(E.PLAY_PROGRESS, (e) => {
        if (!dock.started && e.currentPosition > 0) { dock.started = true; needTap(false); }
        if (!dock.dur) dock.widget.getDuration((ms) => { dock.dur = ms; });
        $('#dock-fill').style.width = (e.relativePosition * 100).toFixed(2) + '%';
        $('#dock-bar').setAttribute('aria-valuenow', Math.round(e.relativePosition * 100));
        $('#dock-time').textContent = `${clock(e.currentPosition)} / ${clock(dock.dur || D.tracks[dock.id].seconds * 1000)}`;
      });
      dock.widget.bind(E.PLAY, () => paused(false));
      dock.widget.bind(E.PAUSE, () => paused(true));
      dock.widget.bind(E.FINISH, () => paused(true));
    } else {
      dock.widget.load(r.sc, Object.assign({ callback: () => { dock.widget.getDuration((ms) => { dock.dur = ms; }); expectSound(); } }, opts));
    }
  }
  // If the browser will not start sound by itself, SoundCloud's own play button slides up for one click.
  dock.tap = Object.assign(document.createElement('div'), { className: 'sc-tap', innerHTML: '<p>Press play once to start the sound</p>' });
  document.body.appendChild(dock.tap);
  function needTap(on) { clearTimeout(dock.wait); if (on) $('#dock-time').textContent = 'Press play'; dock.tap.classList.toggle('on', on); }
  function expectSound() { clearTimeout(dock.wait); dock.wait = setTimeout(() => { if (!dock.started && !dock.el.hidden) needTap(true); }, 2500); }
  $('#dock-play').addEventListener('click', () => { if (dock.widget) { dock.widget.toggle(); if (!dock.started) expectSound(); } });
  $('#dock-close').addEventListener('click', () => {
    if (dock.widget) dock.widget.pause();
    needTap(false); dock.el.hidden = true; html.style.setProperty('--dock', '0px'); paused(true);
  });
  const seek = (f) => { if (dock.widget && dock.dur) dock.widget.seekTo(dock.dur * clamp(f)); };
  $('#dock-bar').addEventListener('click', (e) => { const b = e.currentTarget.getBoundingClientRect(); seek((e.clientX - b.left) / b.width); });
  $('#dock-bar').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    if (!dock.widget || !dock.dur) return;
    dock.widget.getPosition((ms) => dock.widget.seekTo(clamp(ms + (e.key === 'ArrowRight' ? 5000 : -5000), 0, dock.dur)));
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-play]');
    if (b) play(b.dataset.play);
  });
  // where Play leaves the page, say so on the button
  if (!inDock()) $$('.card-links .go').forEach((b) => { b.textContent = 'Play on SoundCloud'; });
})();
