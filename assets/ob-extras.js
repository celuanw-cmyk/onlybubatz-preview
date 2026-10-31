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
    function update() {
      if (window.scrollY > Math.max(0, anchor - 1)) hdr.classList.add('is-pinned');
      else hdr.classList.remove('is-pinned');
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
  var LEAF = '<svg viewBox="-110 -130 220 180" aria-hidden="true" focusable="false" fill="currentColor"><g transform="rotate(-78)"><path d="M0 0 L0.0 -0.0 L1.9 -6.7 L3.5 -13.5 L3.0 -20.2 L3.9 -27.0 L2.7 -33.7 L2.5 -40.5 L0.8 -47.2 L0 -55.2 L-0.8 -47.2 L-2.5 -40.5 L-2.7 -33.7 L-3.9 -27.0 L-3.0 -20.2 L-3.5 -13.5 L-1.9 -6.7 L-0.0 -0.0 Z"/></g><g transform="rotate(-54)"><path d="M0 0 L0.0 -0.0 L3.0 -10.5 L5.4 -20.9 L4.6 -31.4 L6.0 -41.8 L4.1 -52.3 L3.9 -62.7 L1.3 -73.2 L0 -81.2 L-1.3 -73.2 L-3.9 -62.7 L-4.1 -52.3 L-6.0 -41.8 L-4.6 -31.4 L-5.4 -20.9 L-3.0 -10.5 L-0.0 -0.0 Z"/></g><g transform="rotate(-28)"><path d="M0 0 L0.0 -0.0 L4.0 -14.2 L7.3 -28.3 L6.3 -42.5 L8.2 -56.6 L5.6 -70.8 L5.2 -85.0 L1.7 -99.1 L0 -107.1 L-1.7 -99.1 L-5.2 -85.0 L-5.6 -70.8 L-8.2 -56.6 L-6.3 -42.5 L-7.3 -28.3 L-4.0 -14.2 L-0.0 -0.0 Z"/></g><g transform="rotate(0)"><path d="M0 0 L0.0 -0.0 L4.8 -16.9 L8.6 -33.7 L7.5 -50.6 L9.8 -67.4 L6.6 -84.3 L6.2 -101.1 L2.1 -118.0 L0 -126.0 L-2.1 -118.0 L-6.2 -101.1 L-6.6 -84.3 L-9.8 -67.4 L-7.5 -50.6 L-8.6 -33.7 L-4.8 -16.9 L-0.0 -0.0 Z"/></g><g transform="rotate(28)"><path d="M0 0 L0.0 -0.0 L4.0 -14.2 L7.3 -28.3 L6.3 -42.5 L8.2 -56.6 L5.6 -70.8 L5.2 -85.0 L1.7 -99.1 L0 -107.1 L-1.7 -99.1 L-5.2 -85.0 L-5.6 -70.8 L-8.2 -56.6 L-6.3 -42.5 L-7.3 -28.3 L-4.0 -14.2 L-0.0 -0.0 Z"/></g><g transform="rotate(54)"><path d="M0 0 L0.0 -0.0 L3.0 -10.5 L5.4 -20.9 L4.6 -31.4 L6.0 -41.8 L4.1 -52.3 L3.9 -62.7 L1.3 -73.2 L0 -81.2 L-1.3 -73.2 L-3.9 -62.7 L-4.1 -52.3 L-6.0 -41.8 L-4.6 -31.4 L-5.4 -20.9 L-3.0 -10.5 L-0.0 -0.0 Z"/></g><g transform="rotate(78)"><path d="M0 0 L0.0 -0.0 L1.9 -6.7 L3.5 -13.5 L3.0 -20.2 L3.9 -27.0 L2.7 -33.7 L2.5 -40.5 L0.8 -47.2 L0 -55.2 L-0.8 -47.2 L-2.5 -40.5 L-2.7 -33.7 L-3.9 -27.0 L-3.0 -20.2 L-3.5 -13.5 L-1.9 -6.7 L-0.0 -0.0 Z"/></g><rect x="-4" y="-6" width="8" height="40" rx="4"/></svg>';

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
    window.setTimeout(function () {
      el.classList.remove('is-on');
      window.setTimeout(function () { busy = false; }, 240);
    }, reduce ? 120 : 620);
  }

  document.addEventListener('click', function (ev) {
    var trigger = ev.target.closest ? ev.target.closest('[data-cart-open], a[href$="/cart"]') : null;
    if (!trigger) return;
    leafThenOpen();
  }, true);
})();
