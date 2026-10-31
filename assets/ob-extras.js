/* Only Bubatz — Zusatz-Verhalten:
   1) misst die echte Header-Höhe für die klebende Marken-Leiste
   2) Cannabis-Blatt-Übergang beim Öffnen des Warenkorbs
   Wird nach theme.js geladen. */
(function () {
  'use strict';

  /* ---------- 1) Header-Höhe messen ---------- */
  var root = document.documentElement;
  function syncHeader() {
    var hdr = document.querySelector('.site-header');
    if (!hdr) return;
    /* Nur der Header klebt oben — die Ankündigungsleiste scrollt weg */
    root.style.setProperty('--sv-hdr', Math.round(hdr.getBoundingClientRect().height) + 'px');
  }
  syncHeader();
  window.addEventListener('resize', syncHeader, { passive: true });
  window.addEventListener('load', syncHeader);
  window.addEventListener('scroll', function () {
    document.body.classList.toggle('ob-scrolled', window.scrollY > 40);
  }, { passive: true });

  /* ---------- 1b) Marken-Leiste wirklich oben festnageln ---------- */
  function pinBrandbar() {
    var bar = document.querySelector('.shop-v28 .brandbar');
    if (!bar) return;

    var spacer = document.createElement('div');
    spacer.className = 'brandbar-spacer';
    spacer.setAttribute('aria-hidden', 'true');
    spacer.style.display = 'none';
    spacer.style.height = '0px';
    bar.parentNode.insertBefore(spacer, bar);

    var anchor = 0;

    /* Dokumentposition ohne Klebe-Verfälschung (rect.top lügt, wenn die Leiste schon klebt) */
    function docTop(el) {
      var y = 0;
      while (el) { y += el.offsetTop; el = el.offsetParent; }
      return y;
    }
    function barHeight() { return Math.round(bar.getBoundingClientRect().height); }
    function barIsFixed() { return getComputedStyle(bar).position === 'fixed'; }

    /* Platzhalter NUR reservieren, solange die Leiste wirklich aus dem Fluss ist.
       Sonst steht ein leerer Block von Leistenhöhe (52px + 1px Rahmen = 53px)
       über der Leiste — genau das Loch, das nicht passieren darf. */
    function syncSpacer() {
      var reserve = barIsFixed();
      spacer.style.display = reserve ? 'block' : 'none';
      spacer.style.height = reserve ? barHeight() + 'px' : '0px';
    }

    function measure() {
      anchor = docTop(bar);
      syncSpacer();
    }

    function update() {
      var hdr = parseInt(getComputedStyle(root).getPropertyValue('--sv-hdr'), 10) || 0;
      var shouldPin = window.scrollY > anchor - hdr - 1;
      if (shouldPin) bar.classList.add('is-fixed');
      else bar.classList.remove('is-fixed');
      syncSpacer();
    }

    measure();
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', function () { measure(); update(); }, { passive: true });
    window.addEventListener('load', function () { measure(); update(); });
  }
  pinBrandbar();


  /* ---------- 1c) Kopfleiste (Navigation) wirklich festnageln ---------- */
  function pinHeader() {
    var hdr = document.querySelector('.site-header');
    if (!hdr) return;
    var spacer = document.createElement('div');
    spacer.className = 'header-spacer';
    spacer.setAttribute('aria-hidden', 'true');
    spacer.style.display = 'none';
    spacer.style.height = '0px';
    hdr.parentNode.insertBefore(spacer, hdr);

    function docTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
    var anchor = docTop(hdr);
    function sync() {
      var fixed = hdr.classList.contains('is-pinned');
      spacer.style.display = fixed ? 'block' : 'none';
      spacer.style.height = fixed ? Math.round(hdr.getBoundingClientRect().height) + 'px' : '0px';
      var h = Math.round(hdr.getBoundingClientRect().height);
      if (h > 0) root.style.setProperty('--sv-hdr', h + 'px');
    }
    var lastY = window.scrollY;

    function update() {
      var y = window.scrollY;
      if (y > Math.max(0, anchor - 1)) hdr.classList.add('is-pinned');
      else hdr.classList.remove('is-pinned');

      /* runter = weg, hoch = wieder da */
      var delta = y - lastY;
      if (y < 90) hdr.classList.remove('is-hidden');
      else if (delta > 4) hdr.classList.add('is-hidden');
      else if (delta < -4) hdr.classList.remove('is-hidden');
      lastY = y;

      document.documentElement.classList.toggle('ob-hdr-hidden', hdr.classList.contains('is-hidden'));
      sync();
    }
    function measure() { anchor = docTop(hdr); sync(); }
    measure(); update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', function () { measure(); update(); }, { passive: true });
    window.addEventListener('load', function () { measure(); update(); });
  }
  pinHeader();

  /* ---------- 1d) Doppelte Marken-/Kategorie-Leisten zusammenlegen ---------- */
  function dedupeRows() {
    var strip = document.querySelector('.shop-v28 .bbstrip');
    var pills = document.querySelector('.shop-v28 .chipstrip');
    if (!strip || !pills) return;
    function names(root) {
      return Array.prototype.map.call(root.querySelectorAll('a, button'),
        function (el) { return (el.textContent || '').trim().toLowerCase(); })
        .filter(function (t) { return t && t.indexOf('alle') !== 0 && t.length < 24; });
    }
    var a = names(strip), b = names(pills);
    if (!a.length || !b.length) return;
    var hit = b.filter(function (t) { return a.indexOf(t) > -1; }).length;
    if (hit / b.length >= 0.7) {
      var row = pills.closest('.chipstrip') || pills;
      row.setAttribute('data-merged', 'true');
      row.style.display = 'none';
    }
  }
  dedupeRows();
  window.addEventListener('load', dedupeRows);

  /* ---------- 1e) Filter auf dem Handy zuklappbar ---------- */
  (function mobileFilters() {
    var d = document.querySelector('details.filters-m');
    if (!d) return;
    if (window.innerWidth < 1080) d.removeAttribute('open');
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1080) d.setAttribute('open', '');
    }, { passive: true });
  })();

  /* ---------- 2) Cannabis-Blatt beim Warenkorb ---------- */
  var LEAF = '<svg viewBox="-100 -122 200 152" aria-hidden="true" focusable="false" fill="currentColor"><g transform="translate(0 -7.6) rotate(-86) scale(0.34)"><path d="M0 0 C2.60 -6.00 5.20 -12.00 4.20 -17.00 C3.40 -20.00 7.00 -22.00 5.40 -25.00 C4.00 -28.00 8.00 -31.00 6.10 -35.00 C4.50 -39.00 8.70 -43.00 6.60 -47.00 C4.70 -51.00 8.90 -56.00 6.60 -60.00 C4.60 -64.00 8.20 -70.00 5.90 -74.00 C4.00 -78.00 6.60 -85.00 4.50 -89.00 C2.80 -93.00 2.60 -97.00 1.00 -99.00 C0.4 -99.6 0 -100 0 -100 C-2.60 -97.00 -2.80 -93.00 -1.00 -99.00 C-6.60 -85.00 -4.00 -78.00 -4.50 -89.00 C-8.20 -70.00 -4.60 -64.00 -5.90 -74.00 C-8.90 -56.00 -4.70 -51.00 -6.60 -60.00 C-8.70 -43.00 -4.50 -39.00 -6.60 -47.00 C-8.00 -31.00 -4.00 -28.00 -6.10 -35.00 C-7.00 -22.00 -3.40 -20.00 -5.40 -25.00 C-5.20 -12.00 -2.60 -6.00 -4.20 -17.00 Z"/></g><g transform="translate(0 -5.5) rotate(-62) scale(0.54)"><path d="M0 0 C2.60 -6.00 5.20 -12.00 4.20 -17.00 C3.40 -20.00 7.00 -22.00 5.40 -25.00 C4.00 -28.00 8.00 -31.00 6.10 -35.00 C4.50 -39.00 8.70 -43.00 6.60 -47.00 C4.70 -51.00 8.90 -56.00 6.60 -60.00 C4.60 -64.00 8.20 -70.00 5.90 -74.00 C4.00 -78.00 6.60 -85.00 4.50 -89.00 C2.80 -93.00 2.60 -97.00 1.00 -99.00 C0.4 -99.6 0 -100 0 -100 C-2.60 -97.00 -2.80 -93.00 -1.00 -99.00 C-6.60 -85.00 -4.00 -78.00 -4.50 -89.00 C-8.20 -70.00 -4.60 -64.00 -5.90 -74.00 C-8.90 -56.00 -4.70 -51.00 -6.60 -60.00 C-8.70 -43.00 -4.50 -39.00 -6.60 -47.00 C-8.00 -31.00 -4.00 -28.00 -6.10 -35.00 C-7.00 -22.00 -3.40 -20.00 -5.40 -25.00 C-5.20 -12.00 -2.60 -6.00 -4.20 -17.00 Z"/></g><g transform="translate(0 -3.4) rotate(-38) scale(0.74)"><path d="M0 0 C2.60 -6.00 5.20 -12.00 4.20 -17.00 C3.40 -20.00 7.00 -22.00 5.40 -25.00 C4.00 -28.00 8.00 -31.00 6.10 -35.00 C4.50 -39.00 8.70 -43.00 6.60 -47.00 C4.70 -51.00 8.90 -56.00 6.60 -60.00 C4.60 -64.00 8.20 -70.00 5.90 -74.00 C4.00 -78.00 6.60 -85.00 4.50 -89.00 C2.80 -93.00 2.60 -97.00 1.00 -99.00 C0.4 -99.6 0 -100 0 -100 C-2.60 -97.00 -2.80 -93.00 -1.00 -99.00 C-6.60 -85.00 -4.00 -78.00 -4.50 -89.00 C-8.20 -70.00 -4.60 -64.00 -5.90 -74.00 C-8.90 -56.00 -4.70 -51.00 -6.60 -60.00 C-8.70 -43.00 -4.50 -39.00 -6.60 -47.00 C-8.00 -31.00 -4.00 -28.00 -6.10 -35.00 C-7.00 -22.00 -3.40 -20.00 -5.40 -25.00 C-5.20 -12.00 -2.60 -6.00 -4.20 -17.00 Z"/></g><g transform="translate(0 -1.2) rotate(-14) scale(0.95)"><path d="M0 0 C2.60 -6.00 5.20 -12.00 4.20 -17.00 C3.40 -20.00 7.00 -22.00 5.40 -25.00 C4.00 -28.00 8.00 -31.00 6.10 -35.00 C4.50 -39.00 8.70 -43.00 6.60 -47.00 C4.70 -51.00 8.90 -56.00 6.60 -60.00 C4.60 -64.00 8.20 -70.00 5.90 -74.00 C4.00 -78.00 6.60 -85.00 4.50 -89.00 C2.80 -93.00 2.60 -97.00 1.00 -99.00 C0.4 -99.6 0 -100 0 -100 C-2.60 -97.00 -2.80 -93.00 -1.00 -99.00 C-6.60 -85.00 -4.00 -78.00 -4.50 -89.00 C-8.20 -70.00 -4.60 -64.00 -5.90 -74.00 C-8.90 -56.00 -4.70 -51.00 -6.60 -60.00 C-8.70 -43.00 -4.50 -39.00 -6.60 -47.00 C-8.00 -31.00 -4.00 -28.00 -6.10 -35.00 C-7.00 -22.00 -3.40 -20.00 -5.40 -25.00 C-5.20 -12.00 -2.60 -6.00 -4.20 -17.00 Z"/></g><g transform="translate(0 -1.2) rotate(14) scale(0.95)"><path d="M0 0 C2.60 -6.00 5.20 -12.00 4.20 -17.00 C3.40 -20.00 7.00 -22.00 5.40 -25.00 C4.00 -28.00 8.00 -31.00 6.10 -35.00 C4.50 -39.00 8.70 -43.00 6.60 -47.00 C4.70 -51.00 8.90 -56.00 6.60 -60.00 C4.60 -64.00 8.20 -70.00 5.90 -74.00 C4.00 -78.00 6.60 -85.00 4.50 -89.00 C2.80 -93.00 2.60 -97.00 1.00 -99.00 C0.4 -99.6 0 -100 0 -100 C-2.60 -97.00 -2.80 -93.00 -1.00 -99.00 C-6.60 -85.00 -4.00 -78.00 -4.50 -89.00 C-8.20 -70.00 -4.60 -64.00 -5.90 -74.00 C-8.90 -56.00 -4.70 -51.00 -6.60 -60.00 C-8.70 -43.00 -4.50 -39.00 -6.60 -47.00 C-8.00 -31.00 -4.00 -28.00 -6.10 -35.00 C-7.00 -22.00 -3.40 -20.00 -5.40 -25.00 C-5.20 -12.00 -2.60 -6.00 -4.20 -17.00 Z"/></g><g transform="translate(0 -3.4) rotate(38) scale(0.74)"><path d="M0 0 C2.60 -6.00 5.20 -12.00 4.20 -17.00 C3.40 -20.00 7.00 -22.00 5.40 -25.00 C4.00 -28.00 8.00 -31.00 6.10 -35.00 C4.50 -39.00 8.70 -43.00 6.60 -47.00 C4.70 -51.00 8.90 -56.00 6.60 -60.00 C4.60 -64.00 8.20 -70.00 5.90 -74.00 C4.00 -78.00 6.60 -85.00 4.50 -89.00 C2.80 -93.00 2.60 -97.00 1.00 -99.00 C0.4 -99.6 0 -100 0 -100 C-2.60 -97.00 -2.80 -93.00 -1.00 -99.00 C-6.60 -85.00 -4.00 -78.00 -4.50 -89.00 C-8.20 -70.00 -4.60 -64.00 -5.90 -74.00 C-8.90 -56.00 -4.70 -51.00 -6.60 -60.00 C-8.70 -43.00 -4.50 -39.00 -6.60 -47.00 C-8.00 -31.00 -4.00 -28.00 -6.10 -35.00 C-7.00 -22.00 -3.40 -20.00 -5.40 -25.00 C-5.20 -12.00 -2.60 -6.00 -4.20 -17.00 Z"/></g><g transform="translate(0 -5.5) rotate(62) scale(0.54)"><path d="M0 0 C2.60 -6.00 5.20 -12.00 4.20 -17.00 C3.40 -20.00 7.00 -22.00 5.40 -25.00 C4.00 -28.00 8.00 -31.00 6.10 -35.00 C4.50 -39.00 8.70 -43.00 6.60 -47.00 C4.70 -51.00 8.90 -56.00 6.60 -60.00 C4.60 -64.00 8.20 -70.00 5.90 -74.00 C4.00 -78.00 6.60 -85.00 4.50 -89.00 C2.80 -93.00 2.60 -97.00 1.00 -99.00 C0.4 -99.6 0 -100 0 -100 C-2.60 -97.00 -2.80 -93.00 -1.00 -99.00 C-6.60 -85.00 -4.00 -78.00 -4.50 -89.00 C-8.20 -70.00 -4.60 -64.00 -5.90 -74.00 C-8.90 -56.00 -4.70 -51.00 -6.60 -60.00 C-8.70 -43.00 -4.50 -39.00 -6.60 -47.00 C-8.00 -31.00 -4.00 -28.00 -6.10 -35.00 C-7.00 -22.00 -3.40 -20.00 -5.40 -25.00 C-5.20 -12.00 -2.60 -6.00 -4.20 -17.00 Z"/></g><g transform="translate(0 -7.6) rotate(86) scale(0.34)"><path d="M0 0 C2.60 -6.00 5.20 -12.00 4.20 -17.00 C3.40 -20.00 7.00 -22.00 5.40 -25.00 C4.00 -28.00 8.00 -31.00 6.10 -35.00 C4.50 -39.00 8.70 -43.00 6.60 -47.00 C4.70 -51.00 8.90 -56.00 6.60 -60.00 C4.60 -64.00 8.20 -70.00 5.90 -74.00 C4.00 -78.00 6.60 -85.00 4.50 -89.00 C2.80 -93.00 2.60 -97.00 1.00 -99.00 C0.4 -99.6 0 -100 0 -100 C-2.60 -97.00 -2.80 -93.00 -1.00 -99.00 C-6.60 -85.00 -4.00 -78.00 -4.50 -89.00 C-8.20 -70.00 -4.60 -64.00 -5.90 -74.00 C-8.90 -56.00 -4.70 -51.00 -6.60 -60.00 C-8.70 -43.00 -4.50 -39.00 -6.60 -47.00 C-8.00 -31.00 -4.00 -28.00 -6.10 -35.00 C-7.00 -22.00 -3.40 -20.00 -5.40 -25.00 C-5.20 -12.00 -2.60 -6.00 -4.20 -17.00 Z"/></g><rect x="-2.6" y="-6" width="5.2" height="38" rx="2.6"/></svg>';

  var overlay = null;
  function getOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'ob-leaf-fade';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = LEAF;
    document.body.appendChild(overlay);
    return overlay;
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var busy = false;

  /* Element MUSS vor dem ersten Klick im DOM stehen — sonst startet keine Transition */
  if (window.requestAnimationFrame) requestAnimationFrame(function () { getOverlay(); });

  function leafThenOpen() {
    if (reduce) return;            /* Bewegungsfrei: kein Vollflächen-Blitz, Drawer direkt */
    if (busy) return;
    busy = true;
    var el = getOverlay();
    el.classList.remove('is-out');
    void el.offsetWidth;           /* Reflow erzwingen: Startwert steht, Transition läuft */
    el.classList.add('is-on');
    /* Ablauf: 150 ms einblenden · 380 ms Blatt · 100 ms halten · 280 ms ausblenden */
    window.setTimeout(function () {
      el.classList.add('is-out');
      window.setTimeout(function () {
        el.classList.remove('is-on');
        el.classList.remove('is-out');
        busy = false;
      }, 220);
    }, 490);
  }

  document.addEventListener('click', function (ev) {
    var trigger = ev.target.closest ? ev.target.closest('[data-cart-open], a[href$="/cart"]') : null;
    if (!trigger) return;
    leafThenOpen();
  }, true);
})();
