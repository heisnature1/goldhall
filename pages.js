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
  leadership: {
    title: 'Hall Leadership', eyebrow: 'Meet the Team',
    intro: 'Dedicated mentors and student leaders help keep our hall supportive, vibrant and well organised.',
    sections: [
      ['hall-master', 'Hall Master', 'The Hall Master provides strategic direction, pastoral support and oversight for the Gold Refinery Hall community.', 'fa-user-tie'],
      ['senior-tutor', 'Senior Tutor', 'The Senior Tutor supports residents’ welfare and academic progress while helping students connect to university services.', 'fa-chalkboard-teacher'],
      ['executives', 'Student Executives', 'Our elected executives represent residents, lead programmes and make student voices heard.', 'fa-users']
    ]
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
  news: {
    title: 'News & Updates', eyebrow: 'Stay Informed',
    intro: 'The latest announcements, achievements and stories from our hall community.',
    sections: [
      ['news-1', 'Hall Week Preparations Begin', 'Residents and executives are preparing a lively programme of culture, sport and academic activities.', 'fa-bullhorn'],
      ['news-2', 'Academic Excellence Recognised', 'We celebrate residents whose hard work and leadership continue to make the hall proud.', 'fa-award'],
      ['news-3', 'New Study Spaces Open', 'Newly improved common areas give residents more comfortable places to collaborate and focus.', 'fa-lightbulb']
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
  documents: {
    title: 'Documents & Resources', eyebrow: 'Useful Information',
    intro: 'Find the key policies and resources residents use throughout the academic year.',
    sections: [
      ['constitution', 'Hall Constitution', 'Guiding principles, governance and resident responsibilities.', 'fa-file-lines'],
      ['calendar', 'Academic Calendar', 'Important university dates, deadlines and breaks.', 'fa-calendar-check'],
      ['faqs', 'Frequently Asked Questions', 'Quick answers about residence life, support and services.', 'fa-circle-question']
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

const page = pages[pageKey] || pages.about;
if (typeof GoldHallStore !== 'undefined' && GoldHallStore.types.includes(pageKey)) {
  const icons = { news: 'fa-newspaper', events: 'fa-calendar-days', gallery: 'fa-image', documents: 'fa-file-lines' };
  page.sections = GoldHallStore.visible(pageKey).map(item => [item.id, item.title, `${item.text}${item.meta ? `\n${item.meta}` : ''}`, icons[pageKey]]);
}
const links = [
  ['Home', 'index.html'], ['About Us', 'about.html'], ['Students', 'students.html'],
  ['Leadership', 'leadership.html'], ['News', 'news.html'], ['Events', 'events.html'],
  ['Gallery', 'gallery.html'], ['Documents', 'documents.html'], ['Contact', 'contact.html']
];

document.title = `${page.title} | Gold Refinery Hall`;
document.body.innerHTML = `
  <header class="header" id="header"><div class="container">
    <a class="logo-section" href="index.html"><div class="logo-img"><img src="assets/logo/gold-refinery-hall-logo.png" alt="Gold Refinery Hall logo"></div><div class="logo-text"><h1>GOLD REFINERY HALL</h1><p>University of Mines and Technology</p></div></a>
    <div class="header-right"><div class="admin-section"><div class="admin-icon"><img src="assets/logo/pius-tweneboah-administration-logo.png" alt="Pius and Tweneboah administration logo"></div><div class="admin-text"><h3>Gold Hall</h3><p>UMaT, Tarkwa</p></div></div></div>
  </div></header>
  <nav class="nav-section"><div class="container"><ul class="main-nav">${links.map(([label, href]) => `<li><a href="${href}" class="${href === `${pageKey}.html` ? 'active' : ''}">${label}</a></li>`).join('')}</ul></div></nav>
  <main>
    <section class="inner-hero"><div class="container"><span class="eyebrow">${page.eyebrow}</span><h1>${page.title}</h1><p>${page.intro}</p></div></section>
    <section class="page-section"><div class="container"><h2 class="page-title">Explore</h2><p class="page-intro">Discover the people, programmes and resources that make Gold Refinery Hall a place to thrive.</p><div class="content-grid">${page.sections.map(([id, title, text, icon]) => `<article id="${id}" class="content-card"><i class="fas ${icon}"></i><h3>${title}</h3><p>${text.replace(/\n/g, '<br>')}</p></article>`).join('')}</div></div></section>
    <section class="page-cta"><h2>Be part of our community</h2><p>Gold Refinery Hall is more than a residence—it is a place to learn, lead and belong.</p><a class="page-button" href="contact.html">Contact the Hall</a></section>
  </main>
  <footer class="page-footer"><div class="container"><span>© 2025 Gold Refinery Hall, UMaT.</span><a href="index.html">Return to home</a></div></footer>`;

if (pageKey === 'gallery' && typeof GoldHallStore !== 'undefined') {
  GoldHallStore.visible('gallery').forEach(item => {
    const card = document.getElementById(item.id);
    if (card) card.insertAdjacentHTML('afterbegin', `<img class="managed-image" src="${item.meta}" alt="${item.title}">`);
  });
}
