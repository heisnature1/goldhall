/**
 * Gold Hall managed content store (News, Events, Gallery, Documents, Scholarships, Internships).
 * Each item can carry a picture (uploaded file or link) and a link address.
 * Stored in this browser only — see the README security note.
 */
const GoldHallStore = (() => {
  const key = 'goldHallManagedContent';
  const seed = {
    news: [
      { id: 'n1', title: 'Hall Week Preparations Begin', text: 'Residents and executives are preparing a lively programme of culture, sport and academic activities.', meta: 'Development', link: '', image: '', published: true },
      { id: 'n2', title: 'Academic Excellence Recognised', text: 'We celebrate residents whose hard work and leadership continue to make the hall proud.', meta: 'Achievement', link: '', image: '', published: true }
    ],
    events: [
      { id: 'e1', title: 'Hall Week Celebration', text: 'Annual celebration featuring culture, academic competitions and sports events.', meta: '14 February · Main Hall', link: '', image: '', published: true },
      { id: 'e2', title: 'Career Development Workshop', text: 'Interactive session with industry professionals on career planning and development.', meta: '5 March · Conference Room', link: '', image: '', published: true }
    ],
    gallery: [
      { id: 'g1', title: 'Our Campus', text: 'A beautiful setting for study, connection and discovery.', meta: 'Campus', link: '', image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop', published: true },
      { id: 'g2', title: 'Student Life', text: 'Residents come together for events, service and celebration.', meta: 'Community', link: '', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=800&h=600&fit=crop', published: true }
    ],
    documents: [
      { id: 'd1', title: 'Hall Constitution', text: 'Guiding principles, governance and resident responsibilities.', meta: 'Policy', link: '', image: '', published: true },
      { id: 'd2', title: 'Academic Calendar', text: 'Important university dates, deadlines and breaks.', meta: 'Calendar', link: '', image: '', published: true }
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

  const isPicture = value => /^(https?:|data:image\/)/i.test(String(value || '').trim());
  const clone = value => JSON.parse(JSON.stringify(value));

  const read = () => {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(key) || JSON.stringify(seed));
    } catch (_) {
      data = clone(seed);
    }
    // ensure all seed types exist even if localStorage was created before scholarships/internships were added
    Object.keys(seed).forEach(type => {
      if (!Array.isArray(data[type])) {
        data[type] = clone(seed[type]);
      }
      data[type] = data[type].map(item => {
        const next = { ...item, link: item.link || '', image: item.image || '', label: item.label || '' };
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
