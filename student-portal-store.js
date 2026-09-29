/*
 * Gold Hall student portal demo data store.
 * Manages student accounts, polls/votes, and student grievances/complaints.
 * This browser-only store is suitable for a prototype, not a secure election or
 * production account system. Move identity, ballots and admin controls to a
 * server before using this for real student records or binding elections.
 */
const GoldHallPortal = (() => {
  const STUDENTS_KEY = 'goldHallStudents';
  const ELECTION_KEY = 'goldHallElection';
  const VOTES_KEY = 'goldHallVotes';
  const GRIEVANCES_KEY = 'goldHallGrievances';
  const clone = value => JSON.parse(JSON.stringify(value));

  const electionSeed = {
    title: 'Gold Hall Student Polls',
    isOpen: true,
    positions: [
      { id: 'jcr-president', title: 'JCR President', candidates: ['Candidate 1 (demo)', 'Candidate 2 (demo)', 'Candidate 3 (demo)'] },
      { id: 'general-secretary', title: 'General Secretary', candidates: ['Candidate 1 (demo)', 'Candidate 2 (demo)', 'Candidate 3 (demo)'] },
      { id: 'treasurer', title: 'Treasurer', candidates: ['Candidate 1 (demo)', 'Candidate 2 (demo)', 'Candidate 3 (demo)'] },
      { id: 'fashionable-freshman', title: 'Most Fashionable Freshman', candidates: ['Nominee 1 (demo)', 'Nominee 2 (demo)', 'Nominee 3 (demo)'] },
      { id: 'fashionable-executive', title: 'Most Fashionable Executive', candidates: ['Nominee 1 (demo)', 'Nominee 2 (demo)', 'Nominee 3 (demo)'] }
    ]
  };

  const grievanceSeed = [
    {
      id: 'GRV-2026-101',
      studentId: 'UMAT-2026-0042',
      studentName: 'Kwame Asante',
      studentEmail: 'kwame.asante@st.umat.edu.gh',
      programme: 'BSc Minerals Engineering',
      year: '300',
      hallStatus: 'Resident',
      room: 'Block B · Room 14',
      category: 'Room Maintenance & Electrical',
      priority: 'high',
      subject: 'Faulty ceiling fan and sparking bedside socket',
      description: 'The ceiling fan in Block B Room 14 has stopped rotating and emits a loud buzzing sound. Additionally, the study lamp socket is loose and sparks intermittently when plugged in.',
      location: 'Block B, 2nd Floor, Room 14',
      isAnonymous: false,
      createdAt: '2026-09-26T09:30:00.000Z',
      status: 'in-progress',
      adminAction: 'Maintenance Officer Mr. Boateng was assigned on 27 Sep. The fan capacitor was replaced and the electrical wiring is being secured today.',
      adminActionDate: '2026-09-27T14:15:00.000Z',
      actionHandler: 'Hall Maintenance Unit',
      actionHistory: [
        { date: '2026-09-26T11:00:00.000Z', action: 'Complaint received and logged into maintenance queue.', by: 'Hall Administration' },
        { date: '2026-09-27T14:15:00.000Z', action: 'Assigned to Maintenance Officer Mr. Boateng. Replacement parts issued.', by: 'Hall Maintenance Unit' }
      ]
    },
    {
      id: 'GRV-2026-102',
      studentId: 'UMAT-2026-0118',
      studentName: 'Ama Serwaa',
      studentEmail: 'ama.serwaa@st.umat.edu.gh',
      programme: 'BSc Electrical & Electronic Engineering',
      year: '200',
      hallStatus: 'Resident',
      room: 'Block A · Room 08',
      category: 'Water & Plumbing Issues',
      priority: 'urgent',
      subject: 'Low water pressure on 3rd floor washrooms',
      description: 'The overhead taps on Block A 3rd floor washrooms have very low water pressure in the mornings, causing long queues during peak study hours.',
      location: 'Block A, 3rd Floor Washrooms',
      isAnonymous: false,
      createdAt: '2026-09-27T08:10:00.000Z',
      status: 'resolved',
      adminAction: 'Estates and Works flushed the booster header valves and cleared line sediment. Water pressure has been tested and verified at full volume.',
      adminActionDate: '2026-09-28T16:45:00.000Z',
      actionHandler: 'Plumbing & Works Section',
      actionHistory: [
        { date: '2026-09-27T09:00:00.000Z', action: 'Emergency ticket dispatched to Estates and Works.', by: 'Hall Warden' },
        { date: '2026-09-28T16:45:00.000Z', action: 'Booster valve cleared and pressure verified.', by: 'Plumbing & Works Section' }
      ]
    },
    {
      id: 'GRV-2026-103',
      studentId: 'UMAT-2026-0305',
      studentName: 'Emmanuel Mensah',
      studentEmail: 'e.mensah@st.umat.edu.gh',
      programme: 'BSc Computer Science & Engineering',
      year: '400',
      hallStatus: 'Resident',
      room: 'Block C · Room 22',
      category: 'Hall Amenities & Wi-Fi',
      priority: 'normal',
      subject: 'Study room Wi-Fi access point reboot request',
      description: 'The wireless access point inside the 1st Floor Study Room keeps disconnecting during evening peak hours. A router reboot and firmware check would help.',
      location: 'Block C, 1st Floor Study Room',
      isAnonymous: false,
      createdAt: '2026-09-28T18:20:00.000Z',
      status: 'pending',
      adminAction: '',
      adminActionDate: null,
      actionHandler: '',
      actionHistory: []
    }
  ];

  const parse = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : clone(fallback);
    } catch (_) {
      return clone(fallback);
    }
  };
  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  };

  function slug(value) {
    return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || `position-${Date.now()}`;
  }

  function generateGrievanceId() {
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `GRV-2026-${randomNum}`;
  }

  return {
    students() { return parse(STUDENTS_KEY, []); },
    findStudent(studentId) {
      const normalized = String(studentId || '').trim().toUpperCase();
      return this.students().find(student => student.studentId.toUpperCase() === normalized) || null;
    },
    saveStudent(student) {
      const students = this.students();
      students.push(student);
      write(STUDENTS_KEY, students);
    },
    updateStudent(studentId, updates) {
      const students = this.students();
      const index = students.findIndex(student => student.studentId.toUpperCase() === String(studentId).toUpperCase());
      if (index < 0) return false;
      students[index] = { ...students[index], ...updates };
      write(STUDENTS_KEY, students);
      return true;
    },

    /* ---------- election & polls ---------- */
    election() {
      const election = parse(ELECTION_KEY, electionSeed);
      if (!Array.isArray(election.positions)) election.positions = clone(electionSeed.positions);
      return election;
    },
    saveElection(election) {
      const previous = this.election();
      const positions = election.positions.map(position => {
        const existing = previous.positions.find(item => item.id === position.id || item.title.toLowerCase() === position.title.toLowerCase());
        return { ...position, id: existing?.id || slug(position.title) };
      });
      write(ELECTION_KEY, { title: election.title, isOpen: Boolean(election.isOpen), positions });
    },
    votes() { return parse(VOTES_KEY, {}); },
    vote(studentId, positionId, candidate) {
      const votes = this.votes();
      const key = String(studentId).toUpperCase();
      if (votes[key]?.[positionId]) return false;
      votes[key] = { ...(votes[key] || {}), [positionId]: candidate };
      write(VOTES_KEY, votes);
      return true;
    },
    voteFor(studentId, positionId) {
      return this.votes()[String(studentId).toUpperCase()]?.[positionId] || null;
    },
    results(positionId) {
      const tally = {};
      Object.values(this.votes()).forEach(ballot => {
        if (ballot[positionId]) tally[ballot[positionId]] = (tally[ballot[positionId]] || 0) + 1;
      });
      return tally;
    },
    get seedElection() { return clone(electionSeed); },

    /* ---------- grievances & complaints ---------- */
    grievances() {
      const list = parse(GRIEVANCES_KEY, grievanceSeed);
      return Array.isArray(list) ? list : clone(grievanceSeed);
    },
    studentGrievances(studentId) {
      const normalized = String(studentId || '').trim().toUpperCase();
      return this.grievances().filter(g => String(g.studentId || '').toUpperCase() === normalized);
    },
    findGrievance(id) {
      return this.grievances().find(g => g.id === id) || null;
    },
    saveGrievance(data) {
      const list = this.grievances();
      const id = data.id || generateGrievanceId();
      const grievance = {
        id,
        studentId: String(data.studentId || '').trim().toUpperCase(),
        studentName: String(data.studentName || '').trim(),
        studentEmail: String(data.studentEmail || '').trim(),
        programme: String(data.programme || '').trim(),
        year: String(data.year || '').trim(),
        hallStatus: String(data.hallStatus || 'Resident').trim(),
        room: String(data.room || '').trim(),
        category: String(data.category || 'General Hall Matter').trim(),
        priority: String(data.priority || 'normal').toLowerCase().trim(),
        subject: String(data.subject || '').trim(),
        description: String(data.description || '').trim(),
        location: String(data.location || data.room || '').trim(),
        isAnonymous: Boolean(data.isAnonymous),
        createdAt: data.createdAt || new Date().toISOString(),
        status: data.status || 'pending',
        adminAction: data.adminAction || '',
        adminActionDate: data.adminActionDate || null,
        actionHandler: data.actionHandler || '',
        actionHistory: Array.isArray(data.actionHistory) ? data.actionHistory : []
      };
      const existingIndex = list.findIndex(g => g.id === id);
      if (existingIndex >= 0) list[existingIndex] = grievance;
      else list.unshift(grievance);
      write(GRIEVANCES_KEY, list);
      return grievance;
    },
    updateGrievance(id, updates) {
      const list = this.grievances();
      const index = list.findIndex(g => g.id === id);
      if (index < 0) return false;
      const current = list[index];
      const history = Array.isArray(current.actionHistory) ? [...current.actionHistory] : [];
      if (updates.adminAction && updates.adminAction !== current.adminAction) {
        history.unshift({
          date: new Date().toISOString(),
          action: updates.adminAction,
          by: updates.actionHandler || 'Hall Administration'
        });
      }
      list[index] = {
        ...current,
        ...updates,
        actionHistory: updates.actionHistory || history,
        adminActionDate: updates.adminAction ? (updates.adminActionDate || new Date().toISOString()) : current.adminActionDate
      };
      write(GRIEVANCES_KEY, list);
      return true;
    },
    deleteGrievance(id) {
      const list = this.grievances().filter(g => g.id !== id);
      write(GRIEVANCES_KEY, list);
      return true;
    },
    pendingGrievancesCount() {
      return this.grievances().filter(g => g.status === 'pending').length;
    },
    resetGrievances() {
      localStorage.removeItem(GRIEVANCES_KEY);
    }
  };
})();
