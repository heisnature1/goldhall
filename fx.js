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

  /* ----- Page loader: fallback dismissal ----- */

  /*
   * Every page prints the full-screen loader (z-index 99999). script.js
   * dismisses it on the home page and pages.js on the inner pages; the Student
   * Hub, dashboard, reset and confirm pages load neither, so their forms were
   * rendered behind an opaque overlay that nothing ever removed.
   *
   * This is a *fallback*, not a second dismissal: when the page already ships
   * a handler, that handler keeps its own timing and this stays out of the way.
   * Only pages with no handler — plus the hard safety net below — are affected.
   */
  const loader = document.getElementById('pageLoader');
  const loaderOwner = document.querySelector(
    'script[src*="script.js"], script[src*="pages.js"], script[src*="admin.js"]'
  );

  if (loader && !loaderOwner) {
    const dismissLoader = () => {
      if (loader.classList.contains('hidden')) return;
      window.setTimeout(() => loader.classList.add('hidden'), 700);
    };
    if (document.readyState === 'complete') {
      dismissLoader();
    } else {
      window.addEventListener('load', dismissLoader, { once: true });
    }
  }

  /* Safety net for every page, including the ones above: a stalled font, image
     or script must never leave the overlay covering the content. */
  if (loader) {
    window.setTimeout(() => loader.classList.add('hidden'), 3500);
  }

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

  /* ----- 3D tilt, delegated so JS-rendered cards get it too ----- */
  const tiltSelector = '.leader-card, .hub-resource, .content-card, .stat-item, .event-card, .quick-link-card';
  const canTilt = !reduced && window.matchMedia('(pointer: fine)').matches;
  const MAX_TILT = 7;          // degrees, kept gentle so text stays readable
  let activeCard = null;

  const resetCard = card => {
    if (!card) return;
    card.classList.remove('fx-tilting');
    card.style.transform = '';
    card.style.removeProperty('--fx-mx');
    card.style.removeProperty('--fx-my');
    if (activeCard === card) activeCard = null;
  };

  const tiltTo = (card, clientX, clientY) => {
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    const x = px - 0.5;
    const y = py - 0.5;
    card.classList.add('fx-3d', 'fx-tilting');
    card.style.setProperty('--fx-mx', `${(px * 100).toFixed(1)}%`);
    card.style.setProperty('--fx-my', `${(py * 100).toFixed(1)}%`);
    card.style.transform =
      `perspective(900px) rotateX(${(-y * MAX_TILT).toFixed(2)}deg) ` +
      `rotateY(${(x * MAX_TILT).toFixed(2)}deg) translateY(-6px) scale(1.012)`;
    activeCard = card;
  };

  if (canTilt) {
    document.addEventListener('pointermove', event => {
      const card = event.target.closest ? event.target.closest(tiltSelector) : null;
      if (card !== activeCard) resetCard(activeCard);
      if (card) tiltTo(card, event.clientX, event.clientY);
    }, { passive: true });

    /* pointerout fires as the cursor leaves the card; relatedTarget is the
       element being entered, so staying inside the card (a child) is ignored. */
    document.addEventListener('pointerout', event => {
      const card = event.target.closest ? event.target.closest(tiltSelector) : null;
      if (!card) return;
      if (card.contains(event.relatedTarget)) return;
      resetCard(card);
    }, { passive: true });

    document.addEventListener('pointerleave', () => resetCard(activeCard));
    document.addEventListener('mouseleave', () => resetCard(activeCard));
    window.addEventListener('blur', () => resetCard(activeCard));
    window.addEventListener('scroll', () => resetCard(activeCard), { passive: true });
  }

  /* ----- Hero parallax: copy and background drift on different planes ----- */
  const heroCopy = document.querySelector('.hero .hero-content');
  if (heroCopy && !reduced) {
    let raf = 0;
    const paintHero = () => {
      const y = Math.min(window.scrollY, window.innerHeight);
      if (y < 0) return;
      heroCopy.style.transform = `translate3d(0, ${(y * 0.16).toFixed(1)}px, 0) rotateX(${(y * 0.012).toFixed(2)}deg)`;
      raf = 0;
    };
    window.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(paintHero);
    }, { passive: true });
  }

  /* ----- Stagger 3D card reveals column by column ----- */
  if (!reduced) {
    const stagger = scope => {
      const groups = new Map();
      (scope.querySelectorAll ? scope.querySelectorAll('.leader-card, .content-card, .event-card, .gallery-item, .quick-link-card') : [])
        .forEach(card => {
          const key = card.parentElement;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(card);
        });
      groups.forEach(cards => cards.forEach((card, i) => {
        if (card.style.getPropertyValue('--fx-delay')) return;
        card.style.setProperty('--fx-delay', `${(i * 0.06).toFixed(2)}s`);
      }));
    };
    stagger(document);
    // re-run for content rendered later (admin-driven grids)
    new MutationObserver(() => stagger(document)).observe(document.body, { childList: true, subtree: true });
  }

  /* ----- Public hook for JS-rendered views ----- */
  window.GoldHallFX = { observe: scan };
})();
