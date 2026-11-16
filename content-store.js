/**
 * Gold Hall managed content store (Executives, Events, Gallery, Scholarships, Internships).
 * Each item can carry a picture (uploaded file or link) and a link address.
 * Stored in this browser only — see the README security note.
 */
const GoldHallStore = (() => {
  const key = 'goldHallManagedContent';
  const seed = {
    executives: [
      { id: 'x1', title: 'Pius Clinton', text: 'Leading Goldhall with vision and dedication to academic excellence.', meta: 'President of Goldhall', link: '', image: 'assets/images/leadership/pius-clinton-president.jpg', position: '50% 8%', published: true },
      { id: 'x2', title: 'Dr. Pius Tweneboah', text: 'Providing academic guidance and mentorship to all hall residents.', meta: 'Senior Tutor', link: '', image: '', published: true },
      { id: 'x3', title: 'Emmanuel Asante', text: 'Representing the student body and driving hall development initiatives.', meta: 'JCR President', link: '', image: '', published: true }
    ],
    events: [
      { id: 'e1', title: 'Hall Week Celebration', text: 'Annual celebration featuring culture, academic competitions and sports events.', meta: '14 February · Main Hall', link: '', image: '', published: true },
      { id: 'e2', title: 'Career Development Workshop', text: 'Interactive session with industry professionals on career planning and development.', meta: '5 March · Conference Room', link: '', image: '', published: true }
    ],
    gallery: [
      { id: 'g1', title: 'Freshers’ Akwaaba', text: 'Residents and executives welcoming new students at the hall entrance.', meta: 'Freshers’ welcome', link: '', image: 'assets/images/gallery/gallery-01.jpg', published: true },
      { id: 'g2', title: 'Our Campus', text: 'A beautiful setting for study, connection and discovery.', meta: 'Campus', link: '', image: 'assets/images/hero/hero-hall-building.jpg', published: true },
      { id: 'g3', title: 'Hall Community', text: 'Residents come together for events, service and celebration.', meta: 'Community', link: '', image: 'assets/images/hero/hero-students.jpg', published: true },
      { id: 'g4', title: 'Student Life', text: 'Friendships and everyday moments that shape life at Gold Hall.', meta: 'Social life', link: '', image: 'assets/images/hero/hero-campus-life.jpg', published: true }
    ],
    scholarships: [
      {
        id: 's1',
        title: 'Ghana Scholarships Authority',
        text: 'Government-funded scholarship information and application portal for local and foreign tertiary students across Ghana.',
        meta: 'Government Funding · All Year Groups',
        link: 'https://scholarships.gov.gh/',
        label: 'Visit the Authority',
        image: '',
        published: true
      },
      {
        id: 's2',
        title: 'GETFund Tertiary Scholarships',
        text: 'Financial grant and bursary portal managed by the Ghana Education Trust Fund for undergraduate and postgraduate studies.',
        meta: 'Tertiary Education · Financial Grant',
        link: 'https://scholarships.getfund.gov.gh/',
        label: 'Open GETFund Portal',
        image: '',
        published: true
      },
      {
        id: 's3',
        title: 'Mastercard Foundation Scholars Program',
        text: 'Comprehensive educational support covering full tuition, accommodation, study materials, and leadership development for African youth.',
        meta: 'Full Scholarship · Leadership',
        link: 'https://mastercardfdn.org/all/scholars/',
        label: 'Explore Programme',
        image: '',
        published: true
      },
      {
        id: 's4',
        title: 'MTN Ghana Bright Scholarship',
        text: 'Tuition and accommodation grant for brilliant and needy students in public tertiary universities studying STEM, humanities and technology.',
        meta: 'Tuition & Stipends · STEM / General',
        link: 'https://mtn.com.gh/foundation/',
        label: 'Apply on MTN Portal',
        image: '',
        published: true
      }
    ],
    internships: [
      {
        id: 'i1',
        title: 'LinkedIn Ghana Internships & Placements',
        text: 'Browse and apply for real-time industrial attachment and internship openings with top mining, engineering, and tech firms in Ghana.',
        meta: 'Engineering, Mining & Tech',
        link: 'https://www.linkedin.com/jobs/search/?keywords=internship&location=Ghana',
        label: 'Browse Opportunities',
        image: '',
        published: true
      },
      {
        id: 'i2',
        title: 'Indeed Internships Ghana',
        text: 'Search vacation placements, graduate trainee programmes, and entry-level practical attachments with local and multinational employers.',
        meta: 'Vacation & Graduate Roles',
        link: 'https://gh.indeed.com/q-internship-jobs.html',
        label: 'Browse Listings',
        image: '',
        published: true
      },
      {
        id: 'i3',
        title: 'Ghana Chamber of Mines Attachments',
        text: 'Practical industrial training and vacation internship placements across member mining companies and extraction contractors.',
        meta: 'Mining & Minerals Engineering',
        link: 'https://ghanachamberofmines.org/',
        label: 'Visit Chamber Portal',
        image: '',
        published: true
      },
      {
        id: 'i4',
        title: 'National Service Scheme & Pre-Service Portal',
        text: 'Pre-service industrial attachment guidelines, registration, and internship postings for Ghanaian tertiary students.',
        meta: 'Public & Private Placements',
        link: 'https://nss.gov.gh/',
        label: 'Open NSS Portal',
        image: '',
        published: true
      }
    ]
  };

  /* Categories that no longer exist on the site — keep them out of saved data
     so old News/Documents entries cannot resurface anywhere. */
  const retired = ['news', 'documents'];

  const isPicture = value => /^(https?:|data:image\/|assets\/)/i.test(String(value || '').trim());
  const clone = value => JSON.parse(JSON.stringify(value));

  const read = () => {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(key) || JSON.stringify(seed));
    } catch (_) {
      data = clone(seed);
    }
    retired.forEach(type => delete data[type]);
    // ensure all seed types exist even if localStorage was created before executives was added
    Object.keys(seed).forEach(type => {
      if (!Array.isArray(data[type])) {
        data[type] = clone(seed[type]);
      }
      data[type] = data[type].map(item => {
        const next = { ...item, link: item.link || '', image: item.image || '', label: item.label || '', position: item.position || '' };
        if (type === 'gallery' && !next.image && isPicture(next.meta)) { next.image = next.meta; next.meta = ''; }
        return next;
      });
    });
    return data;
  };

  const write = data => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (_) {
      return false; // storage full (usually a large uploaded picture)
    }
  };

  return {
    types: Object.keys(seed),
    get: type => read()[type] || [],
    save: (type, item) => {
      const data = read();
      const items = data[type] || [];
      const index = items.findIndex(entry => entry.id === item.id);
      if (index < 0) items.unshift(item);
      else items[index] = item;
      data[type] = items;
      return write(data);
    },
    remove: (type, id) => {
      const data = read();
      data[type] = (data[type] || []).filter(item => item.id !== id);
      return write(data);
    },
    reset: () => localStorage.removeItem(key),
    visible: type => (read()[type] || []).filter(item => item.published)
  };
})();
