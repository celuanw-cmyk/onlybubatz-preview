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
  var LEAF = '<svg viewBox="-150 -180 300 245" aria-hidden="true" focusable="false" fill="currentColor"><g transform="translate(0 -7.1) rotate(-80)"><path d="M0 0 L4.2 -0.0 L6.0 -4.8 L8.1 -9.7 L7.5 -14.5 L8.8 -19.4 L7.5 -24.2 L8.2 -29.1 L6.6 -33.9 L6.8 -38.8 L5.0 -43.6 L4.6 -48.5 L2.8 -53.3 L1.7 -58.2 L0.0 -63.0 L-0.0 -63.0 L-1.7 -58.2 L-2.8 -53.3 L-4.6 -48.5 L-5.0 -43.6 L-6.8 -38.8 L-6.6 -33.9 L-8.2 -29.1 L-7.5 -24.2 L-8.8 -19.4 L-7.5 -14.5 L-8.1 -9.7 L-6.0 -4.8 L-4.2 -0.0 Z"/></g><g transform="translate(0 -5.1) rotate(-57)"><path d="M0 0 L5.8 -0.0 L8.3 -6.7 L11.2 -13.4 L10.4 -20.1 L12.2 -26.8 L10.4 -33.5 L11.4 -40.2 L9.1 -46.8 L9.3 -53.5 L6.9 -60.2 L6.3 -66.9 L3.9 -73.6 L2.4 -80.3 L0.0 -87.0 L-0.0 -87.0 L-2.4 -80.3 L-3.9 -73.6 L-6.3 -66.9 L-6.9 -60.2 L-9.3 -53.5 L-9.1 -46.8 L-11.4 -40.2 L-10.4 -33.5 L-12.2 -26.8 L-10.4 -20.1 L-11.2 -13.4 L-8.3 -6.7 L-5.8 -0.0 Z"/></g><g transform="translate(0 -3.0) rotate(-34)"><path d="M0 0 L7.6 -0.0 L10.9 -8.8 L14.7 -17.5 L13.7 -26.3 L16.0 -35.1 L13.6 -43.8 L14.9 -52.6 L11.9 -61.4 L12.2 -70.2 L9.0 -78.9 L8.3 -87.7 L5.1 -96.5 L3.2 -105.2 L0.0 -114.0 L-0.0 -114.0 L-3.2 -105.2 L-5.1 -96.5 L-8.3 -87.7 L-9.0 -78.9 L-12.2 -70.2 L-11.9 -61.4 L-14.9 -52.6 L-13.6 -43.8 L-16.0 -35.1 L-13.7 -26.3 L-14.7 -17.5 L-10.9 -8.8 L-7.6 -0.0 Z"/></g><g transform="translate(0 -1.0) rotate(-11)"><path d="M0 0 L9.5 -0.0 L13.6 -11.0 L18.4 -21.9 L17.1 -32.9 L19.9 -43.8 L17.0 -54.8 L18.6 -65.8 L14.9 -76.7 L15.3 -87.7 L11.3 -98.7 L10.4 -109.6 L6.4 -120.6 L3.9 -131.5 L0.0 -142.5 L-0.0 -142.5 L-3.9 -131.5 L-6.4 -120.6 L-10.4 -109.6 L-11.3 -98.7 L-15.3 -87.7 L-14.9 -76.7 L-18.6 -65.8 L-17.0 -54.8 L-19.9 -43.8 L-17.1 -32.9 L-18.4 -21.9 L-13.6 -11.0 L-9.5 -0.0 Z"/></g><g transform="translate(0 -1.0) rotate(11)"><path d="M0 0 L9.5 -0.0 L13.6 -11.0 L18.4 -21.9 L17.1 -32.9 L19.9 -43.8 L17.0 -54.8 L18.6 -65.8 L14.9 -76.7 L15.3 -87.7 L11.3 -98.7 L10.4 -109.6 L6.4 -120.6 L3.9 -131.5 L0.0 -142.5 L-0.0 -142.5 L-3.9 -131.5 L-6.4 -120.6 L-10.4 -109.6 L-11.3 -98.7 L-15.3 -87.7 L-14.9 -76.7 L-18.6 -65.8 L-17.0 -54.8 L-19.9 -43.8 L-17.1 -32.9 L-18.4 -21.9 L-13.6 -11.0 L-9.5 -0.0 Z"/></g><g transform="translate(0 -3.0) rotate(34)"><path d="M0 0 L7.6 -0.0 L10.9 -8.8 L14.7 -17.5 L13.7 -26.3 L16.0 -35.1 L13.6 -43.8 L14.9 -52.6 L11.9 -61.4 L12.2 -70.2 L9.0 -78.9 L8.3 -87.7 L5.1 -96.5 L3.2 -105.2 L0.0 -114.0 L-0.0 -114.0 L-3.2 -105.2 L-5.1 -96.5 L-8.3 -87.7 L-9.0 -78.9 L-12.2 -70.2 L-11.9 -61.4 L-14.9 -52.6 L-13.6 -43.8 L-16.0 -35.1 L-13.7 -26.3 L-14.7 -17.5 L-10.9 -8.8 L-7.6 -0.0 Z"/></g><g transform="translate(0 -5.1) rotate(57)"><path d="M0 0 L5.8 -0.0 L8.3 -6.7 L11.2 -13.4 L10.4 -20.1 L12.2 -26.8 L10.4 -33.5 L11.4 -40.2 L9.1 -46.8 L9.3 -53.5 L6.9 -60.2 L6.3 -66.9 L3.9 -73.6 L2.4 -80.3 L0.0 -87.0 L-0.0 -87.0 L-2.4 -80.3 L-3.9 -73.6 L-6.3 -66.9 L-6.9 -60.2 L-9.3 -53.5 L-9.1 -46.8 L-11.4 -40.2 L-10.4 -33.5 L-12.2 -26.8 L-10.4 -20.1 L-11.2 -13.4 L-8.3 -6.7 L-5.8 -0.0 Z"/></g><g transform="translate(0 -7.1) rotate(80)"><path d="M0 0 L4.2 -0.0 L6.0 -4.8 L8.1 -9.7 L7.5 -14.5 L8.8 -19.4 L7.5 -24.2 L8.2 -29.1 L6.6 -33.9 L6.8 -38.8 L5.0 -43.6 L4.6 -48.5 L2.8 -53.3 L1.7 -58.2 L0.0 -63.0 L-0.0 -63.0 L-1.7 -58.2 L-2.8 -53.3 L-4.6 -48.5 L-5.0 -43.6 L-6.8 -38.8 L-6.6 -33.9 L-8.2 -29.1 L-7.5 -24.2 L-8.8 -19.4 L-7.5 -14.5 L-8.1 -9.7 L-6.0 -4.8 L-4.2 -0.0 Z"/></g><rect x="-5" y="-8" width="10" height="54" rx="5"/></svg>';

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

  function leafThenOpen() {
    if (busy) return;
    busy = true;
    var el = getOverlay();
    el.classList.add('is-on');
    /* Ablauf: 150 ms einblenden · 380 ms Blatt · 100 ms halten · 280 ms ausblenden */
    window.setTimeout(function () {
      el.classList.add('is-out');
      window.setTimeout(function () {
        el.classList.remove('is-on');
        el.classList.remove('is-out');
        busy = false;
      }, 300);
    }, reduce ? 150 : 640);
  }

  document.addEventListener('click', function (ev) {
    var trigger = ev.target.closest ? ev.target.closest('[data-cart-open], a[href$="/cart"]') : null;
    if (!trigger) return;
    leafThenOpen();
  }, true);
})();
