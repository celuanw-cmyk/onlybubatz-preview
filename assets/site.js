/* ==========================================================================
   Only Bubatz — shared site script (auf JEDER Seite geladen)
   Dark-Mode (dunkel Standard + hell, persistiert) · Warenkorb (localStorage)
   Drawer · Modal (Quick View) · Produkt-Rendering · Age-Gate
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Theme ---------- */
  var THEME_KEY = "ob-theme";
  function systemPrefersLight() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
  }
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    // DUNKEL ist Standard; ohne gespeicherte Wahl gilt das System, sonst dunkel.
    var theme = saved === "light" || saved === "dark"
      ? saved
      : (systemPrefersLight() ? "light" : "dark");
    applyTheme(theme);
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    var next = cur === "light" ? "dark" : "light";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  }

  /* ---------- Cart ---------- */
  var CART_KEY = "ob-cart";
  var FREE_SHIP = 49;
  function readCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var c = raw ? JSON.parse(raw) : [];
      return Array.isArray(c) ? c : [];
    } catch (e) { return []; }
  }
  function writeCart(c) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {}
  }
  function cartCount() {
    return readCart().reduce(function (n, it) { return n + (it.qty || 0); }, 0);
  }
  function cartTotal() {
    return readCart().reduce(function (sum, it) {
      var p = OB.getProduct(it.handle);
      var price = p ? (p.priceNum != null ? p.priceNum : 0) : 0;
      return sum + price * (it.qty || 0);
    }, 0);
  }
  function addToCart(handle, qty, silent) {
    qty = qty || 1;
    var c = readCart();
    var found = null;
    for (var i = 0; i < c.length; i++) {
      if (c[i].handle === handle) { found = c[i]; break; }
    }
    if (found) found.qty += qty;
    else c.push({ handle: handle, qty: qty });
    writeCart(c);
    OB.refreshCartUI();
    if (!silent) OB.toast("Zum Warenkorb hinzugefügt");
  }
  function setQty(handle, qty) {
    var c = readCart();
    for (var i = 0; i < c.length; i++) {
      if (c[i].handle === handle) {
        if (qty <= 0) c.splice(i, 1);
        else c[i].qty = qty;
        break;
      }
    }
    writeCart(c);
    OB.refreshCartUI();
  }
  function removeItem(handle) {
    var c = readCart().filter(function (it) { return it.handle !== handle; });
    writeCart(c);
    OB.refreshCartUI();
  }

  /* ---------- Helpers ---------- */
  function money(n) {
    if (n == null || isNaN(n)) return "—";
    return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  }
  function imgSrc(url, w) {
    if (!url) return OB.PLACEHOLDER;
    var sep = url.indexOf("?") === -1 ? "?" : "&";
    return url + sep + "width=" + w;
  }
  function imgSrcset(url) {
    if (!url) return OB.PLACEHOLDER;
    return imgSrc(url, 400) + " 400w, " + imgSrc(url, 800) + " 800w, " + imgSrc(url, 1200) + " 1200w";
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function isDeal(p) {
    return p && p.compareAt != null && p.compareAt !== "";
  }
  function discount(p) {
    if (!isDeal(p)) return 0;
    if (p.compareAtNum == null || p.priceNum == null) return 0;
    if (p.compareAtNum <= p.priceNum) return 0;
    return Math.round((1 - p.priceNum / p.compareAtNum) * 100);
  }

  /* ---------- Bewertungen (ehrlich: Sterne NUR wenn rating vorhanden) ---------- */
  var STAR_PATH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" class="star-bg"><path d="M12 2.7l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95L12 2.7z"/></svg>' +
    '<svg viewBox="0 0 24 24" aria-hidden="true" class="star-fg"><path d="M12 2.7l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95L12 2.7z"/></svg>';

  function starsHTML(rating, reviewCount) {
    if (rating == null || isNaN(rating)) return "";
    var r = Math.max(0, Math.min(5, Number(rating)));
    var html = '<span class="stars" role="img" aria-label="Bewertung: ' +
      r.toFixed(1).replace(".", ",") + ' von 5 Sternen">';
    for (var i = 0; i < 5; i++) {
      var v = r - i;
      var cls = v >= 0.75 ? "s-full" : (v >= 0.25 ? "s-half" : "s-empty");
      html += '<span class="star ' + cls + '">' + STAR_PATH + "</span>";
    }
    html += "</span>";
    if (reviewCount != null && reviewCount > 0) {
      html += '<span class="stars-count">(' + reviewCount + ")</span>";
    }
    return html;
  }

  /* ---------- Zahlungsarten (ehrliche Trust-Signale) ---------- */
  var PAYMENTS = [
    { name: "Visa" },
    { name: "Mastercard" },
    { name: "PayPal" },
    { name: "Klarna" },
    { name: "Apple Pay" },
    { name: "SEPA" }
  ];
  function paymentLogosHTML() {
    return (
      '<div class="payments"><span class="payments-label">Sicher bezahlen:</span>' +
      PAYMENTS.map(function (p) {
        return '<span class="pay">' + escapeHtml(p.name) + "</span>";
      }).join("") +
      "</div>"
    );
  }

  /* Kategorien (4 breite Kacheln) */
  var CATEGORIES = [
    { id: "filter", label: "Filter & Tips" },
    { id: "papes", label: "Papes & Blättchen" },
    { id: "grinder", label: "Grinder & Mühlen" },
    { id: "storage", label: "Aufbewahrung & Zubehör" }
  ];
  function categoryOf(p) {
    var t = (p.type + " " + p.title + " " + p.handle).toLowerCase();
    if (/filter|aktivkohle|cellulose|tip-|tips/.test(t)) return "filter";
    if (/papier|paper|papes|blättchen|blatter|zigarettenpapier|pap-|hemp paper/.test(t)) return "papes";
    if (/grinder|mühle|muhle|grinderkarte|pollinator|mahlwerk|poli-|gri-/.test(t)) return "grinder";
    if (/stash|dose|dosen|behälter|behalter|vakuum|vac|tasche|rucksack|bag|schüssel|schussel|aufbewahr|vorrat|jar|glas|holzkiste|holzkiste|buchversteck|tightvac|silicone|schale/.test(t)) return "storage";
    return "storage";
  }

  var PLACEHOLDER = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">' +
    '<rect width="800" height="800" fill="#0f1011"/>' +
    '<text x="50%" y="50%" font-family="Arial,sans-serif" font-size="34" fill="#8b93a1" ' +
    'text-anchor="middle" dominant-baseline="middle">Only Bubatz</text>' +
    '</svg>'
  );

  /* ---------- Rendering ---------- */
  function cardHTML(p) {
    var deal = isDeal(p);
    var disc = discount(p);
    var badge = deal ? '<span class="card-badge">' + (disc > 0 ? "- " + disc + " %" : "Angebot") + "</span>" : "";
    var strike = deal
      ? "<s>" + money(p.compareAtNum) + "</s>" + (disc > 0 ? '<span class="save">-' + disc + "%</span>" : "")
      : "";
    var link = "produkt.html?handle=" + encodeURIComponent(p.handle);
    var rating = starsHTML(p.rating, p.reviewCount);
    return (
      '<article class="card" data-handle="' + escapeHtml(p.handle) + '">' +
        '<a class="card-media" href="' + link + '" aria-label="' + escapeHtml(p.title) + '">' +
          '<img src="' + imgSrc(p.img, 800) + '" srcset="' + imgSrcset(p.img) + '" ' +
          'sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" width="800" height="800" ' +
          'loading="lazy" decoding="async" alt="' + escapeHtml(p.title) + '" onerror="OB.imgFallback(this)">' +
          badge +
        '</a>' +
        '<button class="card-quick" data-quick="' + escapeHtml(p.handle) + '" aria-label="Schnellansicht">' +
          OB.ICONS.eye +
        '</button>' +
        '<div class="card-body">' +
          '<p class="card-vendor">' + escapeHtml(p.vendor || p.type || "") + '</p>' +
          '<h3 class="card-title"><a href="' + link + '">' + escapeHtml(p.title) + '</a></h3>' +
          (rating ? '<div class="card-rating">' + rating + "</div>" : "") +
          '<div class="card-price">' +
            '<span>' + money(p.priceNum) + "</span>" + strike +
          "</div>" +
          '<button class="btn btn-add" data-add="' + escapeHtml(p.handle) + '">In den Warenkorb</button>' +
        "</div>" +
      "</article>"
    );
  }

  function renderGrid(container, products) {
    if (!container) return;
    container.innerHTML = products.map(cardHTML).join("");
  }

  function getProduct(handle) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].handle === handle) return PRODUCTS[i];
    }
    return null;
  }
  function getDeals() {
    return PRODUCTS.filter(isDeal);
  }

  /* ---------- Icons ---------- */
  var ICONS = {
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7V6a3 3 0 0 1 6 0v1"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4C10 4 4 10 4 20c0-10 6-16 16-16z"/><path d="M4 20c4-8 8-12 12-14"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4h14v13H1z"/><path d="M15 9h4l4 4v4h-8"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="20" r="2"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z"/></svg>',
    grinder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="6" rx="2"/><path d="M5 4V2h14v2M5 10h14l-1 10H6L5 10z"/><path d="M12 13v4"/></svg>'
  };

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  /* ---------- Cart Drawer ---------- */
  function buildDrawer() {
    var scrim = document.createElement("div");
    scrim.className = "drawer-scrim";
    scrim.id = "drawerScrim";
    var drawer = document.createElement("aside");
    drawer.className = "drawer";
    drawer.id = "cartDrawer";
    drawer.setAttribute("aria-label", "Warenkorb");
    drawer.innerHTML =
      '<div class="drawer-head"><h3>Warenkorb</h3>' +
      '<button class="icon-btn" data-close-drawer aria-label="Schließen">' + ICONS.close + "</button></div>" +
      '<div class="drawer-items" id="drawerItems"></div>' +
      '<div class="drawer-foot">' +
        '<div class="free-ship" id="shipMsg"></div>' +
        '<div class="ship-bar"><span id="shipBar"></span></div>' +
        '<div class="grand"><span>Zwischensumme</span><span id="cartTotal">0,00 €</span></div>' +
        '<button class="btn btn-primary btn-block" id="checkoutBtn">Zur Kasse</button>' +
        '<div class="drawer-payments">' + paymentLogosHTML() + "</div>" +
        '<p class="free-ship" style="margin-top:10px;margin-bottom:0">Versand &amp; Steuern werden an der Kasse berechnet.</p>' +
      "</div>";
    document.body.appendChild(scrim);
    document.body.appendChild(drawer);
  }
  function renderDrawerItems() {
    var items = readCart();
    var el = document.getElementById("drawerItems");
    if (!el) return;
    if (!items.length) {
      el.innerHTML = '<div class="empty" style="padding:30px 0"><p>Dein Warenkorb ist noch leer.</p>' +
        '<a class="btn" href="shop.html" style="margin-top:14px">Zum Shop</a></div>';
    } else {
      el.innerHTML = items.map(function (it) {
        var p = OB.getProduct(it.handle);
        if (!p) return "";
        return (
          '<div class="cart-item" data-handle="' + escapeHtml(it.handle) + '">' +
            '<img src="' + imgSrc(p.img, 160) + '" width="64" height="64" loading="lazy" alt="' + escapeHtml(p.title) + '" onerror="OB.imgFallback(this)">' +
            '<div>' +
              '<p class="ci-title">' + escapeHtml(p.title) + "</p>" +
              '<p class="ci-price">' + money(p.priceNum) + "</p>" +
              '<button class="ci-remove" data-remove="' + escapeHtml(it.handle) + '">Entfernen</button>' +
            "</div>" +
            '<div class="ci-qty">' +
              '<button data-dec="' + escapeHtml(it.handle) + '" aria-label="weniger">−</button>' +
              "<span>" + it.qty + "</span>" +
              '<button data-inc="' + escapeHtml(it.handle) + '" aria-label="mehr">+</button>' +
            "</div>" +
          "</div>"
        );
      }).join("");
    }
    renderDrawerFoot();
  }
  function renderDrawerFoot() {
    var total = cartTotal();
    var t = document.getElementById("cartTotal");
    if (t) t.textContent = money(total);
    var msg = document.getElementById("shipMsg");
    var bar = document.getElementById("shipBar");
    if (msg && bar) {
      if (total <= 0) {
        msg.innerHTML = "Noch <b>" + money(FREE_SHIP) + "</b> bis zum kostenfreien Versand.";
        bar.style.width = "0%";
      } else if (total >= FREE_SHIP) {
        msg.innerHTML = "<b>✓ Kostenfreier Versand erreicht.</b>";
        bar.style.width = "100%";
      } else {
        var pct = Math.min(100, Math.round((total / FREE_SHIP) * 100));
        msg.innerHTML = "Noch <b>" + money(FREE_SHIP - total) + "</b> bis zum kostenfreien Versand.";
        bar.style.width = pct + "%";
      }
    }
  }
  function openDrawer() {
    var d = document.getElementById("cartDrawer");
    var s = document.getElementById("drawerScrim");
    if (!d || !s) return;
    renderDrawerItems();
    d.classList.add("open");
    s.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    var d = document.getElementById("cartDrawer");
    var s = document.getElementById("drawerScrim");
    if (d) d.classList.remove("open");
    if (s) s.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ---------- Modal (Quick View) ---------- */
  function buildModal() {
    var scrim = document.createElement("div");
    scrim.className = "modal-scrim";
    scrim.id = "modalScrim";
    var modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "quickModal";
    modal.innerHTML =
      '<button class="modal-close" data-close-modal aria-label="Schließen">' + ICONS.close + "</button>" +
      '<div class="modal-body" id="modalBody"></div>';
    document.body.appendChild(scrim);
    document.body.appendChild(modal);
  }
  function openModal(handle) {
    var p = OB.getProduct(handle);
    if (!p) return;
    var deal = isDeal(p);
    var body = document.getElementById("modalBody");
    var link = "produkt.html?handle=" + encodeURIComponent(p.handle);
    var rating = starsHTML(p.rating, p.reviewCount);
    body.innerHTML =
      '<img src="' + imgSrc(p.img, 900) + '" srcset="' + imgSrcset(p.img) + '" ' +
      'sizes="560px" width="900" height="900" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:6px;border:1px solid var(--border);background:var(--bg-elev2)" alt="' + escapeHtml(p.title) + '" onerror="OB.imgFallback(this)">' +
      '<p class="card-vendor" style="margin-top:18px">' + escapeHtml(p.vendor || p.type) + "</p>" +
      '<h3 style="font-family:var(--font-display);font-weight:400;font-size:24px;text-transform:uppercase;line-height:1.1;margin:6px 0 10px">' + escapeHtml(p.title) + "</h3>" +
      (rating ? '<div class="card-rating" style="margin-bottom:10px">' + rating + "</div>" : "") +
      '<div class="card-price" style="font-size:20px">' +
        '<span>' + money(p.priceNum) + "</span>" +
        (deal ? '<s>' + money(p.compareAtNum) + '</s><span class="save">-' + discount(p) + "%</span>" : "") +
      "</div>" +
      '<p style="font-size:14px;color:var(--text-muted);margin:14px 0 18px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">' +
        escapeHtml((p.desc || "").split("\n")[0].slice(0, 260)) + "</p>" +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<button class="btn btn-primary" data-modal-add="' + escapeHtml(p.handle) + '">In den Warenkorb</button>' +
        '<a class="btn" href="' + link + '">Details ansehen</a>' +
      "</div>";
    document.getElementById("quickModal").classList.add("open");
    document.getElementById("modalScrim").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    var m = document.getElementById("quickModal");
    var s = document.getElementById("modalScrim");
    if (m) m.classList.remove("open");
    if (s) s.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ---------- Age Gate ---------- */
  var AGE_KEY = "ob-age-ok";
  function showAgeGate() {
    try { if (localStorage.getItem(AGE_KEY) === "1") return; } catch (e) {}
    var gate = document.createElement("div");
    gate.className = "age-gate";
    gate.id = "ageGate";
    gate.innerHTML =
      '<div class="box">' +
        '<span class="logo">ONLY<span>BUBATZ</span></span>' +
        "<h2>Bist du 18 oder älter?</h2>" +
        "<p>Dieser Shop richtet sich ausschließlich an Erwachsene ab 18 Jahren. Bitte bestätige dein Alter, um fortzufahren.</p>" +
        '<div class="age-actions">' +
          '<a class="btn btn-primary" href="#" data-age="yes">Ich bin 18+</a>' +
          '<a class="btn" href="https://www.google.com" data-age="no">Ich bin unter 18</a>' +
        "</div>" +
      "</div>";
    document.body.appendChild(gate);
    document.body.style.overflow = "hidden";
  }
  function onAgeGate(e) {
    var yes = e.target.closest('[data-age="yes"]');
    var no = e.target.closest('[data-age="no"]');
    if (yes) {
      e.preventDefault();
      try { localStorage.setItem(AGE_KEY, "1"); } catch (err) {}
      var gate = document.getElementById("ageGate");
      if (gate) gate.remove();
      document.body.style.overflow = "";
    } else if (no) {
      e.preventDefault();
      window.location.href = "https://www.google.com";
    }
  }

  /* ---------- Global delegated events ---------- */
  function bindGlobalEvents() {
    document.addEventListener("click", function (e) {
      var t = e.target;

      var themeBtn = t.closest("#themeToggle");
      if (themeBtn) { toggleTheme(); return; }

      var cartBtn = t.closest("#cartBtn");
      if (cartBtn) { e.preventDefault(); openDrawer(); return; }

      var closeDrawerBtn = t.closest("[data-close-drawer]");
      if (closeDrawerBtn) { closeDrawer(); return; }
      if (t.closest("#drawerScrim")) { closeDrawer(); return; }

      var closeModalBtn = t.closest("[data-close-modal]");
      if (closeModalBtn) { closeModal(); return; }
      if (t.closest("#modalScrim")) { closeModal(); return; }

      var addBtn = t.closest("[data-add]");
      if (addBtn) { addToCart(addBtn.getAttribute("data-add"), 1); return; }

      var modalAdd = t.closest("[data-modal-add]");
      if (modalAdd) {
        addToCart(modalAdd.getAttribute("data-modal-add"), 1);
        closeModal();
        return;
      }

      var quickBtn = t.closest("[data-quick]");
      if (quickBtn) { openModal(quickBtn.getAttribute("data-quick")); return; }

      var inc = t.closest("[data-inc]");
      if (inc) { setQty(inc.getAttribute("data-inc"), getQty(inc.getAttribute("data-inc")) + 1); return; }
      var dec = t.closest("[data-dec]");
      if (dec) { setQty(dec.getAttribute("data-dec"), getQty(dec.getAttribute("data-dec")) - 1); return; }

      var rem = t.closest("[data-remove]");
      if (rem) { removeItem(rem.getAttribute("data-remove")); return; }

      var burger = t.closest("#navBurger");
      if (burger) {
        var nav = document.getElementById("nav");
        if (nav) nav.classList.toggle("open");
        return;
      }

      if (t.closest("#checkoutBtn")) {
        OB.toast("Checkout ist ein Platzhalter (Demo).");
        return;
      }

      var gate = t.closest("[data-age]");
      if (gate) { onAgeGate(e); return; }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeDrawer(); closeModal(); }
    });
  }

  function getQty(handle) {
    var c = readCart();
    for (var i = 0; i < c.length; i++) if (c[i].handle === handle) return c[i].qty;
    return 0;
  }

  /* ---------- Cart badge refresh ---------- */
  function refreshCartUI() {
    var badge = document.getElementById("cartCount");
    if (badge) badge.textContent = cartCount();
    // Aktualisiere Drawer, falls offen
    if (document.getElementById("cartDrawer") && document.getElementById("cartDrawer").classList.contains("open")) {
      renderDrawerItems();
    }
  }

  /* ---------- img fallback ---------- */
  function imgFallback(img) {
    if (img && img.getAttribute("src") !== PLACEHOLDER) {
      img.src = PLACEHOLDER;
      img.removeAttribute("srcset");
    }
  }

  /* ---------- Boot ---------- */
  function boot() {
    initTheme();
    buildDrawer();
    buildModal();
    bindGlobalEvents();
    var tb = document.getElementById("themeToggle");
    if (tb) tb.innerHTML = '<span class="i-sun">' + ICONS.sun + '</span><span class="i-moon">' + ICONS.moon + "</span>";
    var cb = document.getElementById("cartBtn");
    if (cb) cb.innerHTML = ICONS.cart + '<span class="cart-count" id="cartCount">' + cartCount() + "</span>";
    // Zahlungs-Logos im Footer (auf allen Seiten, wo site.js läuft)
    var foot = document.querySelector(".foot-bottom");
    if (foot) foot.insertAdjacentHTML("afterbegin", '<div class="foot-payments">' + paymentLogosHTML() + "</div>");
    refreshCartUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  /* ---------- Public API ---------- */
  window.OB = {
    PRODUCTS: typeof PRODUCTS !== "undefined" ? PRODUCTS : [],
    CATEGORIES: CATEGORIES,
    PLACEHOLDER: PLACEHOLDER,
    ICONS: ICONS,
    money: money,
    imgSrc: imgSrc,
    imgSrcset: imgSrcset,
    cardHTML: cardHTML,
    renderGrid: renderGrid,
    getProduct: getProduct,
    getDeals: getDeals,
    isDeal: isDeal,
    discount: discount,
    categoryOf: categoryOf,
    escapeHtml: escapeHtml,
    addToCart: addToCart,
    setQty: setQty,
    cartCount: cartCount,
    cartTotal: cartTotal,
    readCart: readCart,
    toast: toast,
    refreshCartUI: refreshCartUI,
    imgFallback: imgFallback,
    openModal: openModal,
    showAgeGate: showAgeGate,
    starsHTML: starsHTML,
    paymentLogosHTML: paymentLogosHTML,
    PAYMENTS: PAYMENTS
  };
})();
