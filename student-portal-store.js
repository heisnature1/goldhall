/*
 * Gold Hall student portal store: students, polls and grievances.
 *
 * These records used to live in this browser's localStorage. That meant the
 * administrator's roster only ever showed what had been created on the
 * administrator's own machine, a student's grievance never reached the hall,
 * and a ballot could be recast by clearing site data.
 *
 * Everything now comes from api/portal.php, which talks to the database with
 * the server's secret key. Nothing is stored in the browser, and every method
 * here returns a Promise.
 *
 * The seed values below are only used when the server is unreachable, so a
 * page still renders something instead of looking broken. They are never
 * written anywhere.
 */
const GoldHallPortal = (() => {
  const endpoint = 'api/portal.php';

  const clone = value => JSON.parse(JSON.stringify(value));

  const electionSeed = {
    title: 'Gold Hall Student Polls',
    isOpen: false,
    positions: []
  };

  /* ---------- transport ---------- */

  async function request(action, { method = 'GET', data = {}, params = {} } = {}) {
    const url = new URL(endpoint, window.location.href);
    url.searchParams.set('action', action);

    /* The signed-in student's id travels with every request so the server can
       check that a student is only touching their own records. This is a
       courtesy check, not the security boundary: the real one is that the
       browser has no way to reach the database at all.

       student-hub.js publishes GoldHallSession with id(); it is loaded after
       this file, so the lookup is guarded and re-read on every request. */
    const session = typeof GoldHallSession !== 'undefined' && typeof GoldHallSession.id === 'function'
      ? String(GoldHallSession.id() || '')
      : '';
    if (session) url.searchParams.set('studentId', session);

    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));

    const options = { method, headers: { Accept: 'application/json' } };

    if (method === 'POST') {
      const body = new FormData();
      body.set('action', action);
      if (session) body.set('studentId', session);
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) body.set(key, String(value));
      });
      options.body = body;
    }

    const response = await fetch(url.toString(), options);
    let payload = null;
    try { payload = await response.json(); } catch (_) { payload = null; }

    if (!response.ok) {
      throw new Error(payload?.error || `The hall server returned ${response.status}.`);
    }
    return payload || {};
  }

  /* ---------- students ---------- */

  async function students() {
    try {
      const payload = await request('students');
      return Array.isArray(payload.students) ? payload.students : [];
    } catch (_) {
      /* Offline, or the database is not configured. An empty roster is honest;
         inventing one would be worse. */
      return [];
    }
  }

  async function findStudent(studentId) {
    const wanted = String(studentId || '').trim().toUpperCase();
    if (!wanted) return null;
    try {
      const payload = await request('student', { params: { id: wanted } });
      return payload.student || null;
    } catch (_) {
      return null;
    }
  }

  async function saveStudent(student) {
    const payload = await request('register', { method: 'POST', data: student });
    return payload.student || null;
  }

  async function updateStudent(studentId, updates) {
    /* The id goes in the body only. Sending it as a query parameter as well
       made a mistyped profile field look like a permissions problem, because
       the server reads studentId first and compares it with `id`. */
    await request('update', {
      method: 'POST',
      data: { id: String(studentId), ...updates }
    });
    return true;
  }

  /* ---------- election & polls ---------- */

  async function election() {
    try {
      const payload = await request('election');
      const value = payload.election || {};
      return {
        title: value.title || electionSeed.title,
        isOpen: Boolean(value.isOpen),
        positions: Array.isArray(value.positions) ? value.positions : []
      };
    } catch (_) {
      return clone(electionSeed);
    }
  }

  async function saveElection(next) {
    await request('election-save', {
      method: 'POST',
      data: {
        title: next.title,
        isOpen: next.isOpen ? '1' : '0',
        positions: JSON.stringify(next.positions || [])
      }
    });
    return true;
  }

  /** This student's own ballot: { positionId: candidate }. */
  async function votes() {
    try {
      const payload = await request('votes');
      return payload.votes || {};
    } catch (_) {
      return {};
    }
  }

  async function vote(studentId, positionId, candidate) {
    try {
      await request('vote', { method: 'POST', data: { studentId, position: positionId, candidate } });
      return true;
    } catch (error) {
      /* "Already recorded" is a normal answer, not a failure to report. */
      if (String(error.message || '').includes('already been recorded')) return false;
      throw error;
    }
  }

  async function voteFor(studentId, positionId) {
    const mine = await votes();
    return mine[positionId] || null;
  }

  async function results(positionId) {
    try {
      const payload = await request('results', { params: { position: positionId } });
      return payload.tally || {};
    } catch (_) {
      return {};
    }
  }

  /* ---------- grievances ---------- */

  async function grievances(studentId) {
    try {
      const params = studentId ? { studentId: String(studentId) } : {};
      const payload = await request('grievances', { params });
      return Array.isArray(payload.grievances) ? payload.grievances : [];
    } catch (_) {
      return [];
    }
  }

  async function studentGrievances(studentId) {
    return grievances(studentId);
  }

  async function findGrievance(id) {
    const list = await grievances();
    return list.find(item => item.id === id) || null;
  }

  async function saveGrievance(data) {
    const payload = await request('grievance', { method: 'POST', data });
    return payload.grievance || null;
  }

  async function updateGrievance(id, updates) {
    const data = { id };
    if (updates.actionHistory) data.actionHistory = JSON.stringify(updates.actionHistory);
    await request('grievance-update', {
      method: 'POST',
      data: { ...data, ...updates, id },
      params: { id }
    });
    return true;
  }

  async function deleteGrievance(id) {
    await request('grievance-delete', { method: 'POST', data: { id }, params: { id } });
    return true;
  }

  async function pendingGrievancesCount() {
    const list = await grievances();
    return list.filter(item => item.status === 'pending').length;
  }

  async function resetGrievances() {
    await request('grievance-reset', { method: 'POST' });
    return true;
  }

  return {
    /* students */
    students, findStudent, saveStudent, updateStudent,
    /* polls */
    election, saveElection, votes, vote, voteFor, results,
    /* grievances */
    grievances, studentGrievances, findGrievance, saveGrievance,
    updateGrievance, deleteGrievance, pendingGrievancesCount, resetGrievances,
    /* exposed for tests and for the admin view's empty state */
    get seedElection() { return clone(electionSeed); }
  };
})();
