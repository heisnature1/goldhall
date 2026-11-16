const pageKey = document.body.dataset.page;

const pages = {
  about: {
    title: 'About Gold Refinery Hall', eyebrow: 'Our Story',
    intro: 'A residence where academic ambition, friendship, and service come together.',
    sections: [
      ['history', 'Our History', 'Established to provide a welcoming home for UMaT students, Gold Refinery Hall has grown into a community known for excellence and belonging.', 'fa-landmark'],
      ['mission', 'Mission & Vision', 'We create a safe, inclusive and inspiring living environment that supports every resident’s academic and personal growth.', 'fa-compass'],
      ['values', 'Core Values', 'Excellence, integrity, respect, service and shared responsibility guide how we live and lead together.', 'fa-gem']
    ]
  },
  executives: {
    title: 'Hall Executives', eyebrow: 'Meet the Team',
    intro: 'The executives and tutors who lead Gold Refinery Hall, keep it organised and make sure every resident is heard.',
    sections: []
  },
  students: {
    title: 'Student Life', eyebrow: 'For Residents',
    intro: 'Everything you need to make the most of your time at Gold Refinery Hall.',
    sections: [
      ['council', 'Student Council', 'Your elected council plans hall activities, represents resident interests and strengthens our shared community.', 'fa-people-group'],
      ['clubs', 'Clubs & Societies', 'Find opportunities to compete, create, volunteer and connect through our student-led groups.', 'fa-star'],
      ['support', 'Academic Support', 'Study groups, mentoring and practical resources help residents stay focused and succeed.', 'fa-book-open']
    ]
  },
  events: {
    title: 'Upcoming Events', eyebrow: 'What’s On',
    intro: 'Save the dates and join fellow residents for learning, celebration and connection.',
    sections: [
      ['feb-14', 'Hall Week Celebration', '14 February · 9:00 AM – 6:00 PM · Main Hall', 'fa-calendar-days'],
      ['mar-05', 'Career Development Workshop', '5 March · 2:00 PM – 5:00 PM · Conference Room', 'fa-briefcase'],
      ['mar-20', 'Inter-Hall Debate Competition', '20 March · 10:00 AM – 4:00 PM · Auditorium', 'fa-comments']
    ]
  },
  gallery: {
    title: 'Life at Gold Hall', eyebrow: 'Gallery',
    intro: 'A glimpse of the spaces, friendships and moments that shape our community.',
    sections: [
      ['campus', 'Our Campus', 'A beautiful setting for study, connection and discovery.', 'fa-camera'],
      ['community', 'Our Community', 'Residents come together for events, service and celebration.', 'fa-heart'],
      ['memories', 'Our Memories', 'Every year brings stories worth sharing and remembering.', 'fa-images']
    ]
  },
  contact: {
    title: 'Contact Us', eyebrow: 'We’re Here to Help',
    intro: 'Reach out to the Gold Refinery Hall office for support, questions or general information.',
    sections: [
      ['location', 'Visit Us', 'University of Mines and Technology, Tarkwa, Western Region, Ghana.', 'fa-location-dot'],
      ['phone', 'Call Us', '+233 XX XXX XXXX\nMonday to Friday, 8:00 AM – 5:00 PM', 'fa-phone'],
      ['email', 'Email Us', 'goldhall@umat.edu.gh\nWe will respond as soon as possible.', 'fa-envelope']
    ]
  }
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
const linkLabels = { executives: 'View profile', events: 'Event details', gallery: 'View picture', scholarships: 'Open link', internships: 'Open link' };
const blankFor = href => /^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';

const page = pages[pageKey] || pages.about;
/* Executives are managed from the admin portal — fall back to the seed list
   so the page is never empty if browser storage is unavailable. */
const executiveFallback = [
  ['pius-clinton', 'Pius Clinton', 'President of Goldhall', 'Leading Goldhall with vision and dedication to academic excellence.', 'assets/images/leadership/pius-clinton-president.jpg'],
  ['pius-tweneboah', 'Dr. Pius Tweneboah', 'Senior Tutor', 'Providing academic guidance and mentorship to all hall residents.', ''],
  ['emmanuel-asante', 'Emmanuel Asante', 'JCR President', 'Representing the student body and driving hall development initiatives.', '']
];
if (pageKey === 'executives') {
  page.sections = (typeof GoldHallStore !== 'undefined' ? GoldHallStore.visible('executives') : []).map(item => [item.id, item.title, `${item.meta ? `${item.meta}\n` : ''}${item.text}`, 'fa-user-tie', item.image || '', item.link || '']);
  if (!page.sections.length) page.sections = executiveFallback.map(([id, name, role, text, picture]) => [id, name, `${role}\n${text}`, 'fa-user-tie', picture, '']);
}
if (typeof GoldHallStore !== 'undefined' && GoldHallStore.types.includes(pageKey)) {
  const icons = { executives: 'fa-users', events: 'fa-calendar-days', gallery: 'fa-image', scholarships: 'fa-award', internships: 'fa-briefcase' };
  page.sections = GoldHallStore.visible(pageKey).map(item => [item.id, item.title, `${item.text}${item.meta ? `\n${item.meta}` : ''}`, icons[pageKey], item.image || '', item.link || '']);
}
const links = [
  ['Home', 'index.html', 'fa-house'], ['Student Hub', 'student.html', 'fa-graduation-cap'], ['Executives', 'executives.html', 'fa-users'],
  ['Events', 'events.html', 'fa-calendar-days'], ['Gallery', 'gallery.html', 'fa-images'], ['About Us', 'about.html', 'fa-landmark']
];

/* The Gallery page shows the photos the admin uploads as a photo grid with a
   lightbox, instead of the generic content cards used by the other pages. */
const galleryItems = pageKey === 'gallery'
  ? (page.sections || []).filter(section => section[4])
  : [];
const mainSection = pageKey === 'gallery'
  ? `<section class="page-section"><div class="container"><h2 class="page-title">Photos from the hall</h2><p class="page-intro">Freshers’ welcome, hall week, sports, projects and everyday life at Gold Refinery Hall — updated by the Hall Administrator.</p>${galleryItems.length
      ? `<div class="page-gallery">${galleryItems.map(([id, title, text, icon, picture]) => `<figure class="page-gallery-item" data-caption="${esc(title)}"><img src="${esc(picture)}" alt="${esc(title)}" loading="lazy"></figure>`).join('')}</div>`
      : `<p class="page-empty"><i class="fas fa-image"></i> No photos have been published yet. Check back soon.</p>`}</div></section>
    <div class="page-lightbox" id="pageLightbox" hidden><span class="page-lightbox-close" aria-label="Close">&times;</span><img id="pageLightboxImg" alt=""></div>`
  : `<section class="page-section"><div class="container"><h2 class="page-title">Explore</h2><p class="page-intro">Discover the people, programmes and resources that make Gold Refinery Hall a place to thrive.</p><div class="content-grid">${page.sections.map(([id, title, text, icon, picture, link]) => `<article id="${esc(id)}" class="content-card">${picture ? `<img class="managed-image" src="${esc(picture)}" alt="${esc(title)}">` : `<i class="fas ${esc(icon)}"></i>`}<h3>${esc(title)}</h3><p>${esc(text).replace(/\n/g, '<br>')}</p>${link ? `<a class="content-card-link" href="${esc(link)}"${blankFor(link)}>${linkLabels[pageKey] || 'Open link'} <i class="fas fa-arrow-right"></i></a>` : ''}</article>`).join('')}</div></div></section>`;

document.title = `${page.title} | Gold Refinery Hall`;
document.body.innerHTML = `
  <header class="header" id="header"><div class="container">
    <a class="logo-section" href="index.html"><div class="logo-img"><img src="assets/logo/gold-refinery-hall-logo.png" alt="Gold Refinery Hall logo"></div><div class="logo-text"><h1>GOLD REFINERY HALL</h1><p>University of Mines and Technology</p></div></a>
    <div class="header-right"><div class="admin-section"><div class="admin-icon"><img src="assets/logo/pius-tweneboah-administration-logo.png" alt="Pius and Tweneboah administration logo"></div><div class="admin-text"><h3>Gold Hall</h3><p>UMaT, Tarkwa</p></div></div></div>
  </div></header>
  <nav class="nav-section inner-nav" aria-label="Primary navigation"><div class="container"><ul class="main-nav">${links.map(([label, href, icon]) => `<li><a href="${href}" class="${href === 'student.html' ? 'nav-highlight' : ''} ${href === `${pageKey}.html` ? 'active' : ''}"><i class="fas ${icon}" aria-hidden="true"></i>${label}</a></li>`).join('')}</ul></div></nav>
  <main>
    <section class="inner-hero"><div class="container"><span class="eyebrow">${esc(page.eyebrow)}</span><h1>${esc(page.title)}</h1><p>${esc(page.intro)}</p></div></section>
    ${mainSection}
    <section class="page-cta"><h2>Be part of our community</h2><p>Gold Refinery Hall is more than a residence—it is a place to learn, lead and belong.</p><a class="page-button" href="student.html">Open the Student Hub</a></section>
  </main>
  <footer class="page-footer"><div class="container"><span>© 2026 Gold Refinery Hall, UMaT.</span><a href="index.html">Return to home</a></div></footer>`;

/* Gallery lightbox */
const pageLightbox = document.getElementById('pageLightbox');
if (pageLightbox) {
  const lightboxImg = document.getElementById('pageLightboxImg');
  const closeIt = () => { pageLightbox.hidden = true; document.body.style.overflow = ''; };
  document.querySelectorAll('.page-gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      lightboxImg.src = item.querySelector('img').src;
      lightboxImg.alt = item.dataset.caption || '';
      pageLightbox.hidden = false;
      document.body.style.overflow = 'hidden';
    });
  });
  pageLightbox.addEventListener('click', event => {
    if (event.target === pageLightbox || event.target.classList.contains('page-lightbox-close')) closeIt();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !pageLightbox.hidden) closeIt(); });
}

const innerHeader = document.getElementById('header');
const syncInnerHeaderHeight = () => {
  if (innerHeader && innerHeader.offsetHeight) {
    document.documentElement.style.setProperty('--header-height', `${innerHeader.offsetHeight}px`);
  }
};
syncInnerHeaderHeight();
window.addEventListener('load', syncInnerHeaderHeight);
window.addEventListener('resize', syncInnerHeaderHeight, { passive: true });

