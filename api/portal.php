<?php
/**
 * The Student Hub's data endpoint.
 *
 * The browser used to hold students, grievances, polls and ballots in
 * localStorage, so a student's records existed only on that student's device.
 * Every read and write now comes back through here, and this file is the only
 * thing that talks to Supabase. The secret key stays on the server.
 *
 *   GET  api/portal.php?action=students
 *   GET  api/portal.php?action=student&id=GH1234
 *   GET  api/portal.php?action=grievances[&studentId=GH1234]
 *   GET  api/portal.php?action=election
 *   GET  api/portal.php?action=votes
 *   GET  api/portal.php?action=results&position=slug
 *
 *   POST api/portal.php  action=register   <profile fields>
 *   POST api/portal.php  action=update&id=GH1234    <patch fields>
 *   POST api/portal.php  action=grievance  <grievance fields>
 *   POST api/portal.php  action=grievance-update&id=GRV-...
 *   POST api/portal.php  action=grievance-delete&id=GRV-...
 *   POST api/portal.php  action=grievance-reset
 *   POST api/portal.php  action=election-save
 *   POST api/portal.php  action=vote  (studentId, position, candidate)
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/functions.php';
require_once dirname(__DIR__) . '/includes/supabase.php';
require_once dirname(__DIR__) . '/includes/content.php';
require_once dirname(__DIR__) . '/includes/portal.php';
require_once dirname(__DIR__) . '/includes/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function portal_json(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (!goldhall_portal_ready()) {
    portal_json(503, ['error' => 'The student database is not configured yet.']);
}

$action = (string) ($_POST['action'] ?? $_GET['action'] ?? '');
$method = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' ? 'POST' : 'GET';

/* Who is asking. The hub sends the signed-in student's id; the admin portal is
   already behind a PHP session. */
$sessionStudent = strtoupper(trim((string) ($_POST['studentId'] ?? $_GET['studentId'] ?? '')));
$isAdmin = goldhall_is_admin();

/**
 * Grievances are the one place a student may write, so the rule is narrow:
 * a student may file a grievance for their own id, never read anyone else's.
 */
switch ("$method $action") {
    /* ---------------- students ---------------- */

    case 'GET students':
        portal_json(200, ['students' => goldhall_students()]);

    case 'GET student':
        $student = goldhall_student((string) ($_GET['id'] ?? ''));
        portal_json($student ? 200 : 404, $student ? ['student' => $student] : ['error' => 'No such student.']);

    case 'POST register':
        $profile = [
            'fullName'      => (string) ($_POST['fullName'] ?? ''),
            'studentId'     => (string) ($_POST['studentId'] ?? ''),
            'programme'     => (string) ($_POST['programme'] ?? ''),
            'year'          => (string) ($_POST['year'] ?? ''),
            'room'          => (string) ($_POST['room'] ?? ''),
            'hallStatus'    => (string) ($_POST['hallStatus'] ?? 'Resident'),
            'studentEmail'  => (string) ($_POST['studentEmail'] ?? ''),
            'personalEmail' => (string) ($_POST['personalEmail'] ?? ''),
            'accessStatus'  => 'active',
            'emailConfirmed' => false,
            'authProvider'  => 'supabase',
        ];

        if ($profile['studentId'] === '' || $profile['fullName'] === '') {
            portal_json(422, ['error' => 'A student ID and a full name are required.']);
        }
        if (goldhall_student($profile['studentId']) !== null) {
            portal_json(409, ['error' => 'That student ID already has an account.']);
        }
        if (goldhall_student_email_taken($profile['studentEmail'])) {
            portal_json(409, ['error' => 'That email is already registered to another account.']);
        }
        if (!goldhall_save_student($profile)) {
            portal_json(500, ['error' => 'Could not save the student record.']);
        }
        portal_json(201, ['student' => goldhall_student($profile['studentId'])]);

    case 'POST update':
        $id = strtoupper(trim((string) ($_POST['id'] ?? '')));
        if ($id === '') {
            portal_json(422, ['error' => 'A student ID is required.']);
        }
        /* A student may update their own row; the admin may update anyone's. */
        if (!$isAdmin && $sessionStudent !== $id) {
            portal_json(403, ['error' => 'You can only change your own record.']);
        }
        $updates = [];
        foreach (['fullName', 'programme', 'year', 'room', 'hallStatus', 'studentEmail',
                     'personalEmail', 'accessStatus', 'emailConfirmed', 'completedAt'] as $key) {
            if (array_key_exists($key, $_POST)) {
                $updates[$key] = $_POST[$key];
            }
        }
        if (!goldhall_update_student($id, $updates)) {
            portal_json(500, ['error' => 'Could not update the student record.']);
        }
        portal_json(200, ['ok' => true]);

    /* ---------------- grievances ---------------- */

    case 'GET grievances':
        /* A student sees only their own; the admin sees everything. */
        $filter = $isAdmin ? null : $sessionStudent;
        if (!$isAdmin && $sessionStudent === '') {
            portal_json(403, ['error' => 'Sign in to see your grievances.']);
        }
        portal_json(200, ['grievances' => goldhall_grievances($filter)]);

    case 'POST grievance':
        $studentId = strtoupper(trim((string) ($_POST['studentId'] ?? '')));
        if ($studentId === '') {
            portal_json(422, ['error' => 'A student ID is required.']);
        }
        if (!$isAdmin && $studentId !== $sessionStudent) {
            portal_json(403, ['error' => 'You can only file a grievance for your own account.']);
        }
        $data = $_POST;
        $data['studentId'] = $studentId;
        $saved = goldhall_save_grievance($data);
        if (!$saved['ok']) {
            portal_json(500, ['error' => 'Could not save the grievance: ' . $saved['error']]);
        }
        portal_json(201, ['grievance' => $saved['grievance']]);

    case 'POST grievance-update':
        if (!$isAdmin) {
            portal_json(403, ['error' => 'Only the administrator can respond to a grievance.']);
        }
        $id = (string) ($_POST['id'] ?? '');
        if ($id === '') {
            portal_json(422, ['error' => 'A grievance id is required.']);
        }
        $updates = [];
        foreach (['status', 'actionHandler', 'adminAction', 'adminActionDate', 'actionHistory'] as $key) {
            if (array_key_exists($key, $_POST)) {
                $updates[$key] = $_POST[$key];
            }
        }
        if (isset($_POST['actionHistory']) && is_string($_POST['actionHistory'])) {
            $decoded = json_decode((string) $_POST['actionHistory'], true);
            $updates['actionHistory'] = is_array($decoded) ? $decoded : [];
        }
        if (!goldhall_update_grievance($id, $updates)) {
            portal_json(500, ['error' => 'Could not update the grievance.']);
        }
        portal_json(200, ['ok' => true]);

    case 'POST grievance-delete':
        if (!$isAdmin) {
            portal_json(403, ['error' => 'Only the administrator can delete a grievance.']);
        }
        if (!goldhall_delete_grievance((string) ($_POST['id'] ?? ''))) {
            portal_json(500, ['error' => 'Could not delete the grievance.']);
        }
        portal_json(200, ['ok' => true]);

    case 'POST grievance-reset':
        if (!$isAdmin) {
            portal_json(403, ['error' => 'Only the administrator can reset grievances.']);
        }
        if (!goldhall_reset_grievances()) {
            portal_json(500, ['error' => 'Could not clear the grievances.']);
        }
        portal_json(200, ['ok' => true]);

    /* ---------------- polls and ballots ---------------- */

    case 'GET election':
        portal_json(200, ['election' => goldhall_election()]);

    case 'POST election-save':
        if (!$isAdmin) {
            portal_json(403, ['error' => 'Only the administrator can change the poll.']);
        }
        $positions = json_decode((string) ($_POST['positions'] ?? '[]'), true);
        $saved = goldhall_save_election([
            'title'     => (string) ($_POST['title'] ?? 'Gold Hall Student Polls'),
            'isOpen'    => (string) ($_POST['isOpen'] ?? '') === '1',
            'positions' => is_array($positions) ? $positions : [],
        ]);
        if (!$saved) {
            portal_json(500, ['error' => 'Could not save the poll.']);
        }
        portal_json(200, ['ok' => true]);

    case 'GET votes':
        /* One student's own ballot, so the poll can disable positions they have
           already voted on. Never anyone else's. */
        $all = goldhall_ballots();
        $mine = $sessionStudent !== '' ? ($all[$sessionStudent] ?? []) : [];
        portal_json(200, ['votes' => $mine]);

    case 'GET results':
        portal_json(200, ['tally' => goldhall_results((string) ($_GET['position'] ?? ''))]);

    case 'POST vote':
        $studentId = strtoupper(trim((string) ($_POST['studentId'] ?? '')));
        $position  = (string) ($_POST['position'] ?? '');
        $candidate = (string) ($_POST['candidate'] ?? '');

        if ($studentId === '' || $position === '' || $candidate === '') {
            portal_json(422, ['error' => 'A student, a position and a candidate are required.']);
        }
        if (!$isAdmin && $studentId !== $sessionStudent) {
            portal_json(403, ['error' => 'You can only cast your own vote.']);
        }
        $election = goldhall_election();
        if (!$election['isOpen']) {
            portal_json(409, ['error' => 'Voting has closed.']);
        }
        if (!goldhall_cast_ballot($studentId, $position, $candidate)) {
            portal_json(409, ['error' => 'A vote for this position has already been recorded.']);
        }
        portal_json(201, ['ok' => true]);

    default:
        portal_json(400, ['error' => 'Unknown action.']);
}
