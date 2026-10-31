/* Bewegung: blendet Sektionen beim Scrollen ein.
   Stil, Dauer und Verzögerung kommen aus den Theme-Einstellungen (oder je Sektion).
   Ohne JavaScript bleibt alles sichtbar — die Klasse .ob-anim-ready wird erst hier gesetzt. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nodes = document.querySelectorAll('[data-ob-anim]');
  if (!nodes.length) return;

  if (reduce || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(nodes, function (n) { n.classList.add('is-in'); });
    return;
  }

  Array.prototype.forEach.call(nodes, function (n) {
    var speed = parseInt(n.getAttribute('data-ob-speed'), 10) || 500;
    var delay = parseInt(n.getAttribute('data-ob-delay'), 10) || 0;
    n.style.setProperty('--ob-dur', (speed / 1000) + 's');
    n.style.setProperty('--ob-delay', (delay / 1000) + 's');
    n.classList.add('ob-anim-ready');
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

  Array.prototype.forEach.call(nodes, function (n) {
    // was beim Laden schon im Bild steht, sofort zeigen
    var r = n.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.9) { n.classList.add('is-in'); return; }
    io.observe(n);
  });
})();
