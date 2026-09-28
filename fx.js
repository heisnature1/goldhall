/* ==========================================================================
   GOLDHALL FX — animation engine
   Scroll reveals, scroll progress, hero entrance sync, floating gold
   particles and gentle card tilt. Degrades gracefully: without JS the
   [data-reveal] hiding rules never activate (they are gated on html.fx-ready),
   and prefers-reduced-motion users get a static, calm experience.
   ========================================================================== */
(() => {
  const root = document.documentElement;
  root.classList.add('fx-ready');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- Scroll-reveal system ----- */
  const io = 'IntersectionObserver' in window && !reduced
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('fx-in');
          io.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    : null;

  const watch = el => {
    if (!el || el.dataset.fxSeen) return;
    el.dataset.fxSeen = '1';
    if (!io) { el.classList.add('fx-in'); return; }
    io.observe(el);
  };

  const scan = (scope = document) => {
    if (!scope) return;
    if (scope.matches && scope.matches('[data-reveal]')) watch(scope);
    if (scope.querySelectorAll) scope.querySelectorAll('[data-reveal]').forEach(watch);
  };
  scan(document);

  // Pick up dynamically rendered content (student dashboard, admin views).
  new MutationObserver(records => {
    for (const record of records) {
      record.addedNodes.forEach(node => { if (node.nodeType === 1) scan(node); });
    }
  }).observe(document.body, { childList: true, subtree: true });

  /* ----- Scroll progress bar ----- */
  const bar = document.createElement('div');
  bar.className = 'fx-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  let ticking = false;
  const paintProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (ticking || reduced) return;
    ticking = true;
    requestAnimationFrame(paintProgress);
  }, { passive: true });
  paintProgress();

  /* ----- Hero entrance, synced with the page loader ----- */
  const hero = document.querySelector('.hero');
  if (hero) {
    let armed = false;
    const go = () => hero.classList.add('fx-hero-go');
    const watchLoader = loader => {
      if (loader.classList.contains('hidden')) { go(); return; }
      const mo = new MutationObserver(() => {
        if (loader.classList.contains('hidden')) { mo.disconnect(); go(); }
      });
      mo.observe(loader, { attributes: true, attributeFilter: ['class'] });
    };
    const arm = () => {
      if (armed) return;
      armed = true;
      const loader = document.getElementById('pageLoader');
      if (!loader) { go(); return; }
      // The loader lingers ~1.5s after page load; never hold the entrance longer than 4.5s.
      setTimeout(go, 4500);
      watchLoader(loader);
    };
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });
  }

  /* ----- Floating gold particles ----- */
  const spawnMotes = (host, count) => {
    if (!host || reduced) return;
    host.classList.add('fx-motes');
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i += 1) {
      const mote = document.createElement('span');
      mote.className = 'fx-mote';
      mote.setAttribute('aria-hidden', 'true');
      const size = 3 + Math.random() * 6;
      mote.style.cssText = `left:${(Math.random() * 98).toFixed(2)}%;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;` +
        `animation-duration:${(10 + Math.random() * 14).toFixed(1)}s;animation-delay:${(-Math.random() * 20).toFixed(1)}s;` +
        `--fx-mote-o:${(0.25 + Math.random() * 0.5).toFixed(2)};`;
      frag.appendChild(mote);
    }
    host.appendChild(frag);
  };
  spawnMotes(document.querySelector('.hero'), 16);
  spawnMotes(document.querySelector('.hub-spotlight'), 10);

  /* ----- Gentle 3D tilt (delegated, works for dynamically rendered cards) ----- */
  const tiltSelector = '.leader-card, .hub-resource, .content-card';
  if (!reduced && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('pointermove', event => {
      const card = event.target.closest ? event.target.closest(tiltSelector) : null;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(750px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-4px)`;
    }, { passive: true });
    document.addEventListener('pointerout', event => {
      const card = event.target.closest ? event.target.closest(tiltSelector) : null;
      if (card && !card.contains(event.relatedTarget)) card.style.transform = '';
    });
  }

  /* ----- Public hook for JS-rendered views ----- */
  window.GoldHallFX = { observe: scan };
})();
