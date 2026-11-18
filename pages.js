/* Inner pages: interactions only.
 *
 * The cards, gallery grid and timeline are now rendered by PHP
 * (includes/page-template.php), so this file no longer builds markup. It keeps
 * the pieces that genuinely need a browser:
 *   - dismissing the page loader
 *   - the gallery lightbox
 *   - keeping --header-height correct for the sticky nav
 */
(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ----- Page loader: same emblem transition as the home page ----- */
  const loader = $('#pageLoader');
  if (loader) {
    const dismiss = () => setTimeout(() => loader.classList.add('hidden'), 700);
    if (document.readyState === 'complete') {
      dismiss();
    } else {
      window.addEventListener('load', dismiss, { once: true });
    }
    // Never trap the page if an asset is slow.
    setTimeout(() => loader.classList.add('hidden'), 3500);
  }

  /* ----- Gallery lightbox ----- */
  const lightbox = $('#pageLightbox');
  if (lightbox) {
    const image = $('#pageLightboxImg');
    const close = () => {
      lightbox.hidden = true;
      document.body.style.overflow = '';
    };

    $$('.page-gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        const thumb = $('img', item);
        if (!thumb || !image) return;
        image.src = thumb.src;
        image.alt = item.dataset.caption || '';
        lightbox.hidden = false;
        document.body.style.overflow = 'hidden';
      });
    });

    lightbox.addEventListener('click', event => {
      if (event.target === lightbox || event.target.classList.contains('page-lightbox-close')) {
        close();
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !lightbox.hidden) close();
    });
  }

  /* ----- Sticky nav offset ----- */
  const header = $('#header');
  const syncHeaderHeight = () => {
    if (header && header.offsetHeight) {
      document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    }
  };
  syncHeaderHeight();
  window.addEventListener('load', syncHeaderHeight);
  window.addEventListener('resize', syncHeaderHeight, { passive: true });
})();
