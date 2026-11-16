/* Home page: renders the executives, events and gallery sections from the content
   the admin manages — pictures (upload or link) and links included. */
(() => {
  const escape = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
  const pictureOf = item => item.image || (/^(https?:|data:image\/|assets\/)/i.test(item.meta || '') ? item.meta : '');
  const blankFor = href => /^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';

  const leaders = document.querySelector('[data-executives]');
  const events = document.querySelector('.events-grid');
  const gallery = document.querySelector('.gallery-grid');

  if (leaders && typeof GoldHallStore !== 'undefined') {
    const executives = GoldHallStore.visible('executives');
    if (executives.length) {
      leaders.innerHTML = executives.map(item => {
        const picture = pictureOf(item);
        return `<div class="leader-card">
          <div class="leader-image">
            ${picture ? `<img src="${escape(picture)}" alt="${escape(item.title)}"${/leadership\/pius-clinton/.test(picture) ? ' style="object-position: top center;"' : ''}>` : `<div class="leader-image-fallback"><i class="fas fa-user-tie"></i></div>`}
            <div class="leader-image-overlay"></div>
          </div>
          <div class="leader-info">
            <h3>${escape(item.title)}</h3>
            ${item.meta ? `<p class="position">${escape(item.meta)}</p>` : ''}
            <p>${escape(item.text)}</p>
            <div class="leader-social">
              ${item.link ? `<a href="${escape(item.link)}"${blankFor(item.link)} title="Profile link"><i class="fas fa-link"></i></a>` : ''}
              <a href="#"><i class="fas fa-envelope"></i></a>
              <a href="#"><i class="fab fa-linkedin-in"></i></a>
            </div>
          </div>
        </div>`;
      }).join('');
    }
  }

  if (events) {
    events.innerHTML = GoldHallStore.visible('events').slice(0, 4).map(item => {
      const href = item.link;
      return `<article class="event-card"><div class="event-date-block"><span class="month">EVENT</span><span class="day"><i class="fas fa-calendar"></i></span></div><div class="event-details"><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p><div class="event-meta"><span><i class="fas fa-map-marker-alt"></i> ${escape(item.meta)}</span></div>${href ? `<a href="${escape(href)}" class="news-link"${blankFor(href)}>Event details <i class="fas fa-arrow-right"></i></a>` : ''}</div></article>`;
    }).join('') || '<p>No published events at the moment.</p>';
  }

  if (gallery) {
    gallery.innerHTML = GoldHallStore.visible('gallery').slice(0, 5).map(item => {
      const picture = pictureOf(item);
      return `<div class="gallery-item" onclick="openLightbox(this)"><img src="${escape(picture)}" alt="${escape(item.title)}"><div class="gallery-overlay"><i class="fas fa-search-plus"></i></div></div>`;
    }).join('') || '<p>No published gallery items at the moment.</p>';
  }
})();
