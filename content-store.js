/**
 * Gold Hall managed content store (News, Events, Gallery, Documents).
 * Each item can carry a picture (uploaded file or link) and a link address.
 * Stored in this browser only — see the README security note.
 */
const GoldHallStore = (() => {
  const key = 'goldHallManagedContent';
  const seed = {
    news: [{ id: 'n1', title: 'Hall Week Preparations Begin', text: 'Residents and executives are preparing a lively programme of culture, sport and academic activities.', meta: 'Development', link: '', image: '', published: true }, { id: 'n2', title: 'Academic Excellence Recognised', text: 'We celebrate residents whose hard work and leadership continue to make the hall proud.', meta: 'Achievement', link: '', image: '', published: true }],
    events: [{ id: 'e1', title: 'Hall Week Celebration', text: 'Annual celebration featuring culture, academic competitions and sports events.', meta: '14 February · Main Hall', link: '', image: '', published: true }, { id: 'e2', title: 'Career Development Workshop', text: 'Interactive session with industry professionals on career planning and development.', meta: '5 March · Conference Room', link: '', image: '', published: true }],
    gallery: [{ id: 'g1', title: 'Our Campus', text: 'A beautiful setting for study, connection and discovery.', meta: 'Campus', link: '', image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop', published: true }, { id: 'g2', title: 'Student Life', text: 'Residents come together for events, service and celebration.', meta: 'Community', link: '', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=800&h=600&fit=crop', published: true }],
    documents: [{ id: 'd1', title: 'Hall Constitution', text: 'Guiding principles, governance and resident responsibilities.', meta: 'Policy', link: '', image: '', published: true }, { id: 'd2', title: 'Academic Calendar', text: 'Important university dates, deadlines and breaks.', meta: 'Calendar', link: '', image: '', published: true }]
  };

  const isPicture = value => /^(https?:|data:image\/)/i.test(String(value || '').trim());

  const read = () => {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(key) || JSON.stringify(seed));
    } catch (_) {
      data = JSON.parse(JSON.stringify(seed));
    }
    // older gallery items stored the picture address in `meta` — move it to `image`
    Object.keys(seed).forEach(type => {
      data[type] = (Array.isArray(data[type]) ? data[type] : []).map(item => {
        const next = { ...item, link: item.link || '', image: item.image || '' };
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
