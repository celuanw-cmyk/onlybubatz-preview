/* Bewegung — 10 Stile, je Bereich einstellbar.
   Setzt Dauer, Weg, Verzögerung und Staffelung aus den data-Attributen.
   Ohne JavaScript bleibt alles sichtbar: die Klasse .ob-anim-ready kommt erst hier. */
(function () {
  var nodes = document.querySelectorAll('[data-ob-anim]');
  if (!nodes.length) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CURVES = {
    smooth: 'cubic-bezier(.22, 1, .36, 1)',
    spring: 'cubic-bezier(.34, 1.56, .64, 1)',
    linear: 'linear'
  };

  function setup(n) {
    var speed = parseInt(n.getAttribute('data-ob-speed'), 10) || 700;
    var dist = parseInt(n.getAttribute('data-ob-distance'), 10) || 32;
    var delay = parseInt(n.getAttribute('data-ob-delay'), 10) || 0;
    var stagger = parseInt(n.getAttribute('data-ob-stagger'), 10) || 70;
    var ease = CURVES[n.getAttribute('data-ob-ease')] || CURVES.smooth;

    n.style.setProperty('--ob-dur', (speed / 1000) + 's');
    n.style.setProperty('--ob-dist', dist + 'px');
    n.style.setProperty('--ob-delay', (delay / 1000) + 's');
    n.style.setProperty('--ob-stagger', stagger + 'ms');
    n.style.setProperty('--ob-ease', ease);

    // Kinder für die Staffelung numerieren
    if (n.getAttribute('data-ob-anim') === 'stagger') {
      Array.prototype.forEach.call(n.children, function (c, i) {
        c.style.setProperty('--i', i);
      });
    }
    n.classList.add('ob-anim-ready');
  }

  if (reduce || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(nodes, function (n) { n.classList.add('is-in'); });
    return;
  }

  Array.prototype.forEach.call(nodes, setup);

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });

  var offen = [];
  Array.prototype.forEach.call(nodes, function (n) {
    // was beim Laden schon im Bild steht, sofort zeigen (kein Aufblitzen)
    var r = n.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92) {
      setTimeout(function () { n.classList.add('is-in'); }, 60);
      return;
    }
    io.observe(n);
    offen.push(n);
  });

  /* Sicherheitsnetz: manche Bereiche meldet der Beobachter nie — etwa wenn ein Kind
     auf Null geklippt ist. Darum zusätzlich beim Scrollen prüfen. */
  var tick = false;
  function pruefen() {
    tick = false;
    offen = offen.filter(function (n) {
      if (n.classList.contains('is-in')) return false;
      var r = n.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.94 && r.bottom > 0) {
        n.classList.add('is-in');
        io.unobserve(n);
        return false;
      }
      return true;
    });
    if (!offen.length) {
      window.removeEventListener('scroll', anstossen);
      window.removeEventListener('resize', anstossen);
    }
  }
  function anstossen() {
    if (tick) return;
    tick = true;
    requestAnimationFrame(pruefen);
  }
  window.addEventListener('scroll', anstossen, { passive: true });
  window.addEventListener('resize', anstossen);
  anstossen();
})();
