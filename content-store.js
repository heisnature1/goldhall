/**
 * Gold Hall managed content store (Executives, Events, Gallery, Scholarships, Internships).
 *
 * Since the move to PHP, the authoritative content lives in data/content.json
 * on the server, rendered by includes/content.php and read here through
 * api/content.php. The seed below is only a fallback for when that request
 * fails (file opened directly, offline, endpoint unavailable).
 *
 * The admin portal writes through admin.php; nothing here persists to
 * localStorage any more.
 */
const GoldHallStore = (() => {
  const key = 'goldHallManagedContent';
  const endpoint = 'api/content.php';
  /* Last successful server response, so repeated reads are cheap. */
  let remote = null;
  let pending = null;
  const seed = {
    executives: [
      { id: 'x1', title: 'Pius Clinton', text: 'Leading Goldhall with vision and dedication to academic excellence.', meta: 'President of Goldhall', link: '', image: 'assets/images/leadership/pius-clinton-president.jpg', position: '50% 50%', published: true },
      { id: 'x2', title: 'Dr. Pius Tweneboah', text: 'Providing academic guidance and mentorship to all hall residents.', meta: 'Senior Tutor', link: '', image: '', published: true },
      { id: 'x3', title: 'Emmanuel Asante', text: 'Representing the student body and driving hall development initiatives.', meta: 'JCR President', link: '', image: '', published: true },
      { id: 'x4', title: 'Emmanuel Addo', text: 'Upholding fairness, discipline and the constitutional order of the hall.', meta: 'Judicial Chairman', link: '', image: 'assets/images/leadership/emmanuel-addo-judicial-chairman.jpg', position: '50% 50%', published: true },
      { id: 'x5', title: 'Adu Gyamfi John Diego', text: 'Leading academic programmes, study support and the hall’s academic board.', meta: 'Academic Board Chairman', link: '', image: 'assets/images/leadership/adu-gyamfi-john-diego-academic-board-chairman.jpg', position: '50% 50%', published: true },
      { id: 'x6', title: 'Asante Derrick Gyasi', text: 'Running free, fair and transparent hall elections.', meta: 'Electoral Commissioner', link: '', image: 'assets/images/leadership/asante-derrick-gyasi.jpg', position: '50% 50%', published: true },
      { id: 'x7', title: 'Kojo Kafui Dayie Osei', text: 'Supporting non-resident students and keeping them connected to the hall.', meta: 'Deputy Non-Resident Chairman', link: '', image: 'assets/images/leadership/kojo-kafui-dayie-osei.jpg', position: '50% 50%', published: true },
      { id: 'x8', title: 'Ofori Sem Kwaku', text: 'Representing the interests of every non-resident resident.', meta: 'Non-Resident Chairman', link: '', image: 'assets/images/leadership/ofori-sem-kwaku.jpg', position: '50% 50%', published: true },
      { id: 'x9', title: 'Amoah Godfred Senior', text: 'Overseeing food service, quality and fair prices at the hall canteen.', meta: 'Canteen Chairman', link: '', image: 'assets/images/leadership/amoah-godfred-senior.jpg', position: '50% 50%', published: true },
      { id: 'x10', title: 'Kingsley Ankamah', text: 'Organising hall sports, inter-hall games and fitness activities.', meta: 'Sports Chairman', link: '', image: 'assets/images/leadership/kingsley-ankamah.jpg', position: '50% 50%', published: true },
      { id: 'x11', title: 'Meshack Todeme', text: 'Coordinating the executive team and hall administration.', meta: 'Chief of Staff', link: '', image: 'assets/images/leadership/meshack-todeme.jpg', position: '50% 50%', published: true },
      { id: 'x12', title: 'Amo-Addae Prince', text: 'Supporting study programmes and academic welfare for residents.', meta: 'Deputy Academic Board Chairman', link: '', image: 'assets/images/leadership/amo-addae-prince.jpg', position: '50% 50%', published: true },
      { id: 'x13', title: 'Owusu Manaseh Danso', text: 'Looking after resident wellbeing, support and pastoral care.', meta: 'Welfare Chairman', link: '', image: 'assets/images/leadership/owusu-manaseh-danso.jpg', position: '50% 50%', published: true },
      { id: 'x14', title: 'Desmond Karikari', text: 'Supporting hall projects and development works.', meta: 'Deputy Project Manager', link: '', image: 'assets/images/leadership/desmond-karikari.jpg', position: '50% 50%', published: true },
      { id: 'x15', title: 'Brown Ekow Papa', text: 'Overseeing hall projects, works and the physical development of Gold Hall.', meta: 'Project Manager', link: '', image: 'assets/images/leadership/brown-ekow-papa-project-manager.jpg', position: '50% 50%', published: true },
      { id: 'x16', title: 'Adam Faizatu Bandaw', text: 'Keeping the hall records, correspondence and executive minutes in order.', meta: 'General Secretary', link: '', image: 'assets/images/leadership/adam-faizatu-bandaw-general-secretary.jpg', position: '50% 50%', published: true }
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

  /* Corrections that must reach browsers which already saved an earlier list.
     read() only tops up missing ids, so a renamed or retitled entry would
     otherwise keep its old value in localStorage forever. Keyed by id so an
     entry someone has genuinely edited themselves is left alone. */
  const corrections = {
    x11: { title: 'Meshack Todeme' }
  };

  const applyCorrections = data => Object.entries(corrections).forEach(([id, fix]) => {
    Object.values(data).forEach(list => {
      if (!Array.isArray(list)) return;
      list.forEach(item => {
        if (item && item.id === id) Object.assign(item, fix);
      });
    });
  });

  const isPicture = value => /^(https?:|data:image\/|assets\/)/i.test(String(value || '').trim());
  const clone = value => JSON.parse(JSON.stringify(value));

  /* Fetch from the server once; later calls reuse the result. */
  const load = () => {
    if (remote) return Promise.resolve(remote);
    if (pending) return pending;
    pending = fetch(endpoint, { headers: { Accept: 'application/json' } })
      .then(response => (response.ok ? response.json() : null))
      .then(payload => {
        remote = payload && typeof payload === 'object' ? payload : null;
        return remote;
      })
      .catch(() => null);
    return pending;
  };

  /** Synchronous read for templates; returns the seed until load() resolves. */
  const read = () => {
    if (remote) return remote;
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
      /* Top up from the seed so people added to the site later still appear
         for browsers that saved an older list. Nothing is overwritten. */
      const known = new Set(data[type].map(item => item.id));
      seed[type].forEach(item => {
        if (!known.has(item.id)) data[type].push(clone(item));
      });
      data[type] = data[type].map(item => {
        const next = { ...item, link: item.link || '', image: item.image || '', label: item.label || '', position: item.position || '' };
        if (type === 'gallery' && !next.image && isPicture(next.meta)) { next.image = next.meta; next.meta = ''; }
        return next;
      });
    });
    applyCorrections(data);
    return data;
  };

  return {
    types: Object.keys(seed),
    /** Resolves once server content has been loaded (or failed). */
    ready: load,
    get: type => read()[type] || [],
    visible: type => (read()[type] || []).filter(item => item.published),
    /* Writes are handled server-side by admin.php, which owns the JSON file. */
    save: () => false,
    remove: () => false,
    reset: () => localStorage.removeItem(key)
  };
})();
