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
    bar.parentNode.insertBefore(spacer, bar);

    var anchor = 0;
    function measure() {
      var wasFixed = bar.classList.contains('is-fixed');
      if (wasFixed) bar.classList.remove('is-fixed');
      var rect = bar.getBoundingClientRect();
      anchor = rect.top + window.scrollY;
      spacer.style.height = Math.round(rect.height) + 'px';
      if (wasFixed) bar.classList.add('is-fixed');
    }

    function update() {
      var hdr = parseInt(getComputedStyle(root).getPropertyValue('--sv-hdr'), 10) || 0;
      var shouldPin = window.scrollY > anchor - hdr - 1;
      if (shouldPin && !bar.classList.contains('is-fixed')) {
        spacer.style.display = 'block';
        bar.classList.add('is-fixed');
      } else if (!shouldPin && bar.classList.contains('is-fixed')) {
        bar.classList.remove('is-fixed');
        spacer.style.display = 'none';
      }
    }

    measure();
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', function () { measure(); update(); }, { passive: true });
    window.addEventListener('load', function () { measure(); update(); });
  }
  pinBrandbar();

  /* ---------- 2) Cannabis-Blatt beim Warenkorb ---------- */
  var LEAF = '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
    '<g>' +
    '<path d="M50 96c-2.6 0-4.4-1.6-4.4-4.2V52.6C38 60.5 27.9 64 19.8 64c-4.8 0-8.5-1.2-10.6-3.4 3 .4 6-.5 8.4-2.2-4.2-.5-7.4-2.3-9.2-5 2.7.5 5.3.2 7.3-.8-3.6-1.3-6-3.7-6.9-6.6 2.8.9 5.4 1.2 7.6 1-3.2-2-5-4.8-5-7.9 3.9 1.9 7.7 2.9 11.2 3.1-2.4-2.4-3.4-5.1-2.8-7.7 2.1 2.4 4.8 4.2 8 5.3-2.4-6.6-1.3-12.6 3-16.6.5 6.2 3 11.7 7 16.1 2.2-2.6 3.4-5.7 3.4-9.2 4 4.5 5.4 10 4.2 16.2 3.1-1.2 5.7-3 7.8-5.4.6 2.7-.4 5.4-2.8 7.8 3.5-.2 7.3-1.2 11.2-3.1 0 3.1-1.8 5.9-5 7.9 2.2.2 4.8-.1 7.6-1-.9 2.9-3.3 5.3-6.9 6.6 2 1 4.6 1.3 7.3.8-1.8 2.7-5 4.5-9.2 5 2.4 1.7 5.4 2.6 8.4 2.2-2.1 2.2-5.8 3.4-10.6 3.4-8.1 0-18.2-3.5-25.8-11.4v39.2c0 2.6-1.8 4.2-4.4 4.2z"/>' +
    '</g></svg>';

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
