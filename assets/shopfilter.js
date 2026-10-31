/* Only Bubatz · v27 — Sortiment-Filter (lokal, keine Live-Wirkung)
   Marken-Leiste + Kategorie + Preis + Sortierung greifen auf dieselben Karten zu.
   Keine erfundenen Zahlen: Karten-Zahlen kommen aus den data-Attributen (Katalog). */
(() => {
  'use strict';
  const bar = document.getElementById('brandbar');
  if (!bar) return;

  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const strip  = $('#bbstrip'), panel = $('#brandpanel'), more = $('#bbmore');
  const search = $('#bbsearch'), count = $('#fcount'), pills = $('#fpills');
  const reset  = $('#freset'), empty = $('#bbempty'), grid = $('.pgrid');
  const price  = $('#fprice'), pricelbl = $('#fpricelbl'), sortSel = $('#fsort');
  const cards  = $$('.pgrid .card');
  const tabs   = $$('.brandtab'), items = $$('.bpitem'), chips = $$('.chip');

  const key = s => (s || '').trim().toLowerCase();
  const num = c => parseFloat(c.getAttribute('data-price')) || 0;
  const PMAX = price ? parseFloat(price.max) : Infinity;
  const state = { brand: '', cat: '', price: PMAX, sort: 'pop' };

  /* ---------- Navbar-Höhe für die Sticky-Leiste ---------- */
  const hdr = $('header.site');
  const setHdr = () => document.documentElement.style.setProperty('--hdr', (hdr ? hdr.offsetHeight : 76) + 'px');
  setHdr();
  window.addEventListener('resize', setHdr);
  window.addEventListener('scroll', () => bar.classList.toggle('scrolled', bar.getBoundingClientRect().top <= 1), { passive: true });

  /* ---------- Zeichnen ---------- */
  function paint() {
    const b = key(state.brand), c = state.cat, p = state.price;

    // Sortierschlüssel vorbereiten
    let order = cards.slice();
    if (state.sort === 'asc')       order.sort((x, y) => num(x) - num(y));
    else if (state.sort === 'desc') order.sort((x, y) => num(y) - num(x));
    else if (state.sort === 'new')  order.sort((x, y) => (+y.dataset.i) - (+x.dataset.i));
    else                            order.sort((x, y) => (+x.dataset.i) - (+y.dataset.i));
    order.forEach((card, i) => { card.style.order = i; });

    let shown = 0;
    cards.forEach(card => {
      const hit = (!b || key(card.dataset.brand) === b)
               && (!c || card.dataset.cat === c)
               && (num(card) <= p);
      card.style.display = hit ? '' : 'none';
      if (hit) shown++;
    });

    // Zähler + Leerzustand
    if (count) count.textContent = shown;
    if (empty) {
      empty.hidden = shown !== 0;
      /* v28: zwei Leerfaelle — Marke allein nennt die Katalogzahl, Kombination nennt die Kombination */
      if (!shown) {
        var akt = document.querySelector('.brandtab[data-brand="' + CSS.escape(state.brand || '') + '"]');
        var bcnt = akt ? parseInt(akt.dataset.count || '0', 10) : 0;
        var nurMarke = state.brand && !state.cat && p >= PMAX;
        var kombi = [state.brand, state.cat].filter(Boolean).join(' + ');
        empty.querySelector('b').textContent = nurMarke ? 'Keine ' + state.brand + '-Artikel in dieser Vorschau' : 'Keine Treffer';
        empty.querySelector('p').textContent = nurMarke
          ? 'Im Sortiment sind ' + bcnt + '.'
          : kombi + ' gibt es in dieser Vorschau nicht.' + (state.brand && bcnt ? ' Im Sortiment sind ' + bcnt + ' ' + state.brand + '-Artikel.' : '');
      }
    }

    // Marken-Tabs / Panel
    tabs.forEach(t => t.classList.toggle('on', key(t.dataset.brand) === b));
    items.forEach(t => t.classList.toggle('on', key(t.dataset.brand) === b));

    // Kategorie-Chips + Sidebar
    chips.forEach(ch => {
      const on = (ch.dataset.cat || '') === c;
      ch.classList.toggle('on', on);
      ch.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $$('input[name="fcat"]').forEach(r => { r.checked = (r.value || '') === c; });

    // Preis-Label
    if (pricelbl) pricelbl.textContent = p >= PMAX ? 'alle' : Math.round(p) + ' €';

    // Filter-Pills
    const list = [];
    if (state.brand) list.push(['brand', 'Marke: ' + state.brand]);
    if (state.cat)   list.push(['cat', state.cat]);
    if (p < PMAX)    list.push(['price', 'bis ' + Math.round(p) + ' €']);
    if (pills) pills.innerHTML = list.map(([k, label]) =>
      `<span class="fpill">${label}<button type="button" data-clear="${k}" aria-label="Filter entfernen">&times;</button></span>`).join('');
    if (reset) reset.hidden = list.length === 0;
  }

  /* ---------- Panel ---------- */
  const openPanel  = () => { panel.classList.add('open'); more.setAttribute('aria-expanded', 'true'); if (search) setTimeout(() => search.focus(), 120); };
  const closePanel = () => { panel.classList.remove('open'); more.setAttribute('aria-expanded', 'false'); };
  const togglePanel = () => panel.classList.contains('open') ? closePanel() : openPanel();

  function setBrand(b, close = true) {
    state.brand = b || '';
    paint();
    if (close) closePanel();
    const on = tabs.find(t => key(t.dataset.brand) === key(state.brand));
    if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function resetAll() {
    state.brand = ''; state.cat = ''; state.price = PMAX; state.sort = 'pop';
    if (price) price.value = price.max;
    if (sortSel) sortSel.value = 'pop';
    paint();
  }

  /* ---------- Events ---------- */
  document.addEventListener('click', e => {
    const tab = e.target.closest('.brandtab, .bpitem');
    if (tab) { e.preventDefault(); setBrand(tab.dataset.brand); return; }

    const chip = e.target.closest('.chip');
    if (chip) { e.preventDefault(); state.cat = chip.dataset.cat || ''; paint(); return; }

    const clr = e.target.closest('[data-clear]');
    if (clr) {
      const k = clr.dataset.clear;
      if (k === 'brand') state.brand = '';
      if (k === 'cat') state.cat = '';
      if (k === 'price') { state.price = PMAX; if (price) price.value = price.max; }
      paint(); return;
    }

    if (e.target.closest('[data-reset], #freset')) { resetAll(); return; }
    if (e.target.closest('#bbmore')) { togglePanel(); return; }
    if (e.target.closest('[data-bpclose]')) { closePanel(); return; }
    if (e.target.closest('#marklink')) { openPanel(); return; }
    if (panel.classList.contains('open') && !e.target.closest('#brandpanel') && !e.target.closest('#brandbar')) closePanel();
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(); });

  if (price) price.addEventListener('input', () => { state.price = parseFloat(price.value); paint(); });
  if (sortSel) sortSel.addEventListener('change', () => { state.sort = sortSel.value; paint(); });
  document.addEventListener('change', e => {
    if (e.target.matches('input[name="fcat"]')) { state.cat = e.target.value || ''; paint(); }
  });

  if (search) search.addEventListener('input', () => {
    const q = key(search.value);
    let n = 0;
    items.forEach(it => {
      const hit = !q || key(it.textContent).includes(q);
      it.classList.toggle('hide', !hit);
      if (hit) n++;
    });
    let none = panel.querySelector('.bpempty');
    if (!none) { none = document.createElement('p'); none.className = 'bpempty'; none.textContent = 'Keine Marke gefunden.'; $('#bpgrid').appendChild(none); }
    none.style.display = n ? 'none' : '';
  });

  /* Ausgangswert Preis-Regler = "alle" */
  if (price && parseFloat(price.value) === PMAX) state.price = PMAX;
  paint();
})();
