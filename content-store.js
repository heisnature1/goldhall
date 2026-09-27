const GoldHallStore = (() => {
  const key = 'goldHallManagedContent';
  const seed = {
    news: [{ id: 'n1', title: 'Hall Week Preparations Begin', text: 'Residents and executives are preparing a lively programme of culture, sport and academic activities.', meta: 'Development', published: true }, { id: 'n2', title: 'Academic Excellence Recognised', text: 'We celebrate residents whose hard work and leadership continue to make the hall proud.', meta: 'Achievement', published: true }],
    events: [{ id: 'e1', title: 'Hall Week Celebration', text: 'Annual celebration featuring culture, academic competitions and sports events.', meta: '14 February · Main Hall', published: true }, { id: 'e2', title: 'Career Development Workshop', text: 'Interactive session with industry professionals on career planning and development.', meta: '5 March · Conference Room', published: true }],
    gallery: [{ id: 'g1', title: 'Our Campus', text: 'A beautiful setting for study, connection and discovery.', meta: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop', published: true }, { id: 'g2', title: 'Student Life', text: 'Residents come together for events, service and celebration.', meta: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=800&h=600&fit=crop', published: true }],
    documents: [{ id: 'd1', title: 'Hall Constitution', text: 'Guiding principles, governance and resident responsibilities.', meta: 'Policy', published: true }, { id: 'd2', title: 'Academic Calendar', text: 'Important university dates, deadlines and breaks.', meta: 'Calendar', published: true }]
  };
  const read = () => JSON.parse(localStorage.getItem(key) || JSON.stringify(seed));
  const write = data => localStorage.setItem(key, JSON.stringify(data));
  return { types: Object.keys(seed), get: type => read()[type] || [], save: (type, item) => { const data = read(); const items = data[type] || []; const i = items.findIndex(x => x.id === item.id); i < 0 ? items.unshift(item) : items[i] = item; data[type] = items; write(data); }, remove: (type, id) => { const data = read(); data[type] = (data[type] || []).filter(item => item.id !== id); write(data); }, reset: () => localStorage.removeItem(key), visible: type => read()[type].filter(item => item.published) };
})();
