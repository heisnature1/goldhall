(() => {
  const escape = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
  const news = document.querySelector('.news-grid');
  const events = document.querySelector('.events-grid');
  const gallery = document.querySelector('.gallery-grid');
  if (news) news.innerHTML = GoldHallStore.visible('news').slice(0, 3).map(item => `<article class="news-card"><div class="news-body"><span class="news-category">${escape(item.meta)}</span><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p><a href="news.html" class="news-link">Read More <i class="fas fa-arrow-right"></i></a></div></article>`).join('') || '<p>No published news at the moment.</p>';
  if (events) events.innerHTML = GoldHallStore.visible('events').slice(0, 4).map(item => `<article class="event-card"><div class="event-date-block"><span class="month">EVENT</span><span class="day"><i class="fas fa-calendar"></i></span></div><div class="event-details"><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p><div class="event-meta"><span><i class="fas fa-map-marker-alt"></i> ${escape(item.meta)}</span></div></div></article>`).join('') || '<p>No published events at the moment.</p>';
  if (gallery) gallery.innerHTML = GoldHallStore.visible('gallery').slice(0, 5).map(item => `<div class="gallery-item" onclick="openLightbox(this)"><img src="${escape(item.meta)}" alt="${escape(item.title)}"><div class="gallery-overlay"><i class="fas fa-search-plus"></i></div></div>`).join('') || '<p>No published gallery items at the moment.</p>';
})();
