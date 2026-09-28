/*
 * Gold Hall student portal demo data store.
 * This browser-only store is suitable for a prototype, not a secure election or
 * production account system. Move identity, ballots and admin controls to a
 * server before using this for real student records or binding elections.
 */
const GoldHallPortal = (() => {
  const STUDENTS_KEY = 'goldHallStudents';
  const ELECTION_KEY = 'goldHallElection';
  const VOTES_KEY = 'goldHallVotes';
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

  const parse = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : clone(fallback);
    } catch (_) {
      return clone(fallback);
    }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  function slug(value) {
    return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || `position-${Date.now()}`;
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
    get seedElection() { return clone(electionSeed); }
  };
})();
