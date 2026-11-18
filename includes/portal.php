<?php
/**
 * Student records, grievances, polls and ballots, stored in Supabase.
 *
 * These lived in each browser's localStorage, which meant the administrator's
 * roster saw only what had been created on the administrator's own machine,
 * grievances never reached the desk, and a ballot could be recast by clearing
 * site data. They now live in the database (see supabase-schema.sql, section 6).
 *
 * Everything here is server-side. The browser never holds the secret key and
 * never talks to Supabase directly, so RLS can stay closed on all four tables
 * while the server reaches them with the key it already uses for content.
 */

declare(strict_types=1);

require_once __DIR__ . '/content.php';

/** True when the portal tables are reachable. */
function goldhall_portal_ready(): bool
{
    return goldhall_uses_supabase();
}

/**
 * Camel-case keys the browser expects, from a snake-case database row.
 *
 * The client code predates the move to the database and speaks camelCase
 * throughout, so translating here keeps the change out of the UI.
 */
function goldhall_student_from_row(array $row): array
{
    return [
        'studentId'      => (string) ($row['student_id'] ?? ''),
        'fullName'       => (string) ($row['full_name'] ?? ''),
        'programme'      => (string) ($row['programme'] ?? ''),
        'year'           => (string) ($row['level'] ?? ''),
        'room'           => (string) ($row['room'] ?? ''),
        'hallStatus'     => (string) ($row['hall_status'] ?? 'Resident'),
        'studentEmail'   => (string) ($row['student_email'] ?? ''),
        'personalEmail'  => (string) ($row['personal_email'] ?? ''),
        'accessStatus'   => (string) ($row['access_status'] ?? 'active'),
        'emailConfirmed' => (bool) ($row['email_confirmed'] ?? false),
        'authProvider'   => (string) ($row['auth_provider'] ?? 'supabase'),
        'createdAt'      => (string) ($row['created_at'] ?? ''),
        'completedAt'    => $row['completed_at'] ?? null,
    ];
}

/** A student array, shaped for the database. Ids are upper-cased like the hub. */
function goldhall_student_to_row(array $student): array
{
    $row = [
        'student_id'      => strtoupper(trim((string) ($student['studentId'] ?? ''))),
        'full_name'       => (string) ($student['fullName'] ?? ''),
        'programme'       => (string) ($student['programme'] ?? ''),
        'level'           => (string) ($student['year'] ?? ''),
        'room'            => (string) ($student['room'] ?? ''),
        'hall_status'     => (string) ($student['hallStatus'] ?? 'Resident'),
        'student_email'   => strtolower(trim((string) ($student['studentEmail'] ?? ''))),
        'personal_email'  => strtolower(trim((string) ($student['personalEmail'] ?? ''))),
        'access_status'   => (string) ($student['accessStatus'] ?? 'active'),
        'email_confirmed' => (bool) ($student['emailConfirmed'] ?? false),
        'auth_provider'   => (string) ($student['authProvider'] ?? 'supabase'),
    ];

    /* Only send timestamps when there is one: Postgres rejects '' for a
       timestamptz, and a null would clear an existing value. */
    if (!empty($student['completedAt'])) {
        $row['completed_at'] = (string) $student['completedAt'];
    }

    return $row;
}

/** Every student. */
function goldhall_students(): array
{
    $response = goldhall_supabase('GET', '/rest/v1/students', [
        'select' => '*',
        'order'  => 'full_name.asc',
    ]);
    if (!$response['ok'] || !is_array($response['json'])) {
        return [];
    }
    return array_values(array_map('goldhall_student_from_row', array_filter($response['json'], 'is_array')));
}

/** One student by id, or null. */
function goldhall_student(string $studentId): ?array
{
    $studentId = strtoupper(trim($studentId));
    if ($studentId === '') {
        return null;
    }
    $response = goldhall_supabase('GET', '/rest/v1/students', [
        'select' => '*',
        'student_id' => 'eq.' . $studentId,
        'limit'  => '1',
    ]);
    if (!$response['ok'] || !is_array($response['json']) || !$response['json']) {
        return null;
    }
    $row = $response['json'][0] ?? null;
    return is_array($row) ? goldhall_student_from_row($row) : null;
}

/** True when an account already uses this email, ignoring one student id. */
function goldhall_student_email_taken(string $email, string $exceptStudentId = ''): bool
{
    $email = strtolower(trim($email));
    if ($email === '') {
        return false;
    }
    $response = goldhall_supabase('GET', '/rest/v1/students', [
        'select' => 'student_id,student_email,personal_email',
        'or'     => '(student_email.eq.' . $email . ',personal_email.eq.' . $email . ')',
    ]);
    if (!$response['ok'] || !is_array($response['json'])) {
        return false;
    }
    foreach ($response['json'] as $row) {
        if (!is_array($row)) {
            continue;
        }
        if ($exceptStudentId !== '' && strtoupper((string) ($row['student_id'] ?? '')) === $exceptStudentId) {
            continue;
        }
        return true;
    }
    return false;
}

/** Insert or update one student. */
function goldhall_save_student(array $student): bool
{
    $row = goldhall_student_to_row($student);
    if ($row['student_id'] === '') {
        return false;
    }
    $response = goldhall_supabase(
        'POST',
        '/rest/v1/students',
        ['on_conflict' => 'student_id'],
        [$row],
        ['Prefer: resolution=merge-duplicates,return=minimal']
    );
    return $response['ok'];
}

/** Patch the given columns of one student. */
function goldhall_update_student(string $studentId, array $updates): bool
{
    $studentId = strtoupper(trim($studentId));
    if ($studentId === '') {
        return false;
    }

    /* Explicit mapping: a camelCase key the client sent maps to one column, so
       nothing unintended is ever written. */
    $columns = [
        'fullName'       => 'full_name',
        'programme'      => 'programme',
        'year'           => 'level',
        'room'           => 'room',
        'hallStatus'     => 'hall_status',
        'studentEmail'   => 'student_email',
        'personalEmail'  => 'personal_email',
        'accessStatus'   => 'access_status',
        'emailConfirmed' => 'email_confirmed',
        'authProvider'   => 'auth_provider',
        'completedAt'    => 'completed_at',
    ];

    $patch = [];
    foreach ($columns as $key => $column) {
        if (!array_key_exists($key, $updates)) {
            continue;
        }
        $value = $updates[$key];
        if ($column === 'completed_at') {
            /* null is meaningful here: it clears the completion date. */
            $patch[$column] = $value === null || $value === '' ? null : (string) $value;
        } elseif ($column === 'email_confirmed') {
            $patch[$column] = (bool) $value;
        } else {
            $patch[$column] = (string) $value;
        }
    }

    if (!$patch) {
        return true;
    }

    $response = goldhall_supabase('PATCH', '/rest/v1/students', [
        'student_id' => 'eq.' . $studentId,
    ], $patch, ['Prefer: return=minimal']);

    return $response['ok'];
}

/* -------------------------------------------------------------------------
 * Grievances
 * ---------------------------------------------------------------------- */

function goldhall_grievance_from_row(array $row): array
{
    $history = $row['action_history'] ?? [];
    if (is_string($history)) {
        $decoded = json_decode($history, true);
        $history = is_array($decoded) ? $decoded : [];
    }
    return [
        'id'              => (string) ($row['id'] ?? ''),
        'studentId'       => (string) ($row['student_id'] ?? ''),
        'studentName'     => (string) ($row['student_name'] ?? ''),
        'studentEmail'    => (string) ($row['student_email'] ?? ''),
        'programme'       => (string) ($row['programme'] ?? ''),
        'year'            => (string) ($row['level'] ?? ''),
        'hallStatus'      => (string) ($row['hall_status'] ?? 'Resident'),
        'room'            => (string) ($row['room'] ?? ''),
        'category'        => (string) ($row['category'] ?? ''),
        'priority'        => (string) ($row['priority'] ?? 'normal'),
        'subject'         => (string) ($row['subject'] ?? ''),
        'description'     => (string) ($row['description'] ?? ''),
        'location'        => (string) ($row['location'] ?? ''),
        'isAnonymous'     => (bool) ($row['is_anonymous'] ?? false),
        'createdAt'       => (string) ($row['created_at'] ?? ''),
        'status'          => (string) ($row['status'] ?? 'pending'),
        'adminAction'     => (string) ($row['admin_action'] ?? ''),
        'adminActionDate' => $row['admin_action_at'] ?? null,
        'actionHandler'   => (string) ($row['action_handler'] ?? ''),
        'actionHistory'   => is_array($history) ? $history : [],
    ];
}

/** All grievances, newest first, optionally only one student's. */
function goldhall_grievances(?string $studentId = null): array
{
    $query = [
        'select' => '*',
        'order'  => 'created_at.desc',
    ];
    if ($studentId !== null) {
        $query['student_id'] = 'eq.' . strtoupper(trim($studentId));
    }
    $response = goldhall_supabase('GET', '/rest/v1/grievances', $query);
    if (!$response['ok'] || !is_array($response['json'])) {
        return [];
    }
    return array_values(array_map('goldhall_grievance_from_row', array_filter($response['json'], 'is_array')));
}

/** Next free grievance reference. */
function goldhall_grievance_id(): string
{
    $response = goldhall_supabase('GET', '/rest/v1/grievances', ['select' => 'id', 'limit' => '1000']);
    $taken = [];
    if ($response['ok'] && is_array($response['json'])) {
        foreach ($response['json'] as $row) {
            if (is_array($row)) {
                $taken[(string) ($row['id'] ?? '')] = true;
            }
        }
    }
    for ($attempt = 0; $attempt < 50; $attempt++) {
        $candidate = 'GRV-' . date('Y') . '-' . random_int(100, 999);
        if (!isset($taken[$candidate])) {
            return $candidate;
        }
    }
    return 'GRV-' . date('Y') . '-' . random_int(1000, 9999);
}

/** Insert one grievance, or update it when the id already exists. */
function goldhall_save_grievance(array $data): array
{
    $id = (string) ($data['id'] ?? '');
    if ($id === '') {
        $id = goldhall_grievance_id();
    }

    $row = [
        'id'             => $id,
        'student_id'     => strtoupper(trim((string) ($data['studentId'] ?? ''))),
        'student_name'   => (string) ($data['studentName'] ?? ''),
        'student_email'  => strtolower(trim((string) ($data['studentEmail'] ?? ''))),
        'programme'      => (string) ($data['programme'] ?? ''),
        'level'          => (string) ($data['year'] ?? ''),
        'hall_status'    => (string) ($data['hallStatus'] ?? 'Resident'),
        'room'           => (string) ($data['room'] ?? ''),
        'category'       => (string) ($data['category'] ?? 'General Hall Matter'),
        'priority'       => strtolower((string) ($data['priority'] ?? 'normal')),
        'subject'        => (string) ($data['subject'] ?? ''),
        'description'    => (string) ($data['description'] ?? ''),
        'location'       => (string) ($data['location'] ?? ($data['room'] ?? '')),
        'is_anonymous'   => (bool) ($data['isAnonymous'] ?? false),
        'status'         => (string) ($data['status'] ?? 'pending'),
        'admin_action'   => (string) ($data['adminAction'] ?? ''),
        'action_handler' => (string) ($data['actionHandler'] ?? ''),
        'action_history' => is_array($data['actionHistory'] ?? null) ? $data['actionHistory'] : [],
    ];
    if (!empty($data['createdAt'])) {
        $row['created_at'] = (string) $data['createdAt'];
    }
    if (!empty($data['adminActionDate'])) {
        $row['admin_action_at'] = (string) $data['adminActionDate'];
    }

    $response = goldhall_supabase(
        'POST',
        '/rest/v1/grievances',
        ['on_conflict' => 'id'],
        [$row],
        ['Prefer: resolution=merge-duplicates,return=representation']
    );

    if (!$response['ok']) {
        return ['ok' => false, 'error' => $response['error'], 'grievance' => null];
    }
    $saved = $response['json'][0] ?? null;
    return [
        'ok' => true,
        'error' => '',
        'grievance' => is_array($saved) ? goldhall_grievance_from_row($saved) : array_merge($data, ['id' => $id]),
    ];
}

/** Patch one grievance. */
function goldhall_update_grievance(string $id, array $updates): bool
{
    $row = [];
    if (array_key_exists('status', $updates))         $row['status'] = (string) $updates['status'];
    if (array_key_exists('actionHandler', $updates))  $row['action_handler'] = (string) $updates['actionHandler'];
    if (array_key_exists('adminAction', $updates))    $row['admin_action'] = (string) $updates['adminAction'];
    if (array_key_exists('adminActionDate', $updates)) {
        /* '' and null both mean "no action recorded yet". */
        $row['admin_action_at'] = empty($updates['adminActionDate']) ? null : (string) $updates['adminActionDate'];
    }
    if (array_key_exists('actionHistory', $updates) && is_array($updates['actionHistory'])) {
        $row['action_history'] = $updates['actionHistory'];
    }
    if (!$row) {
        return true;
    }
    $response = goldhall_supabase('PATCH', '/rest/v1/grievances', [
        'id' => 'eq.' . $id,
    ], $row, ['Prefer: return=minimal']);
    return $response['ok'];
}

function goldhall_delete_grievance(string $id): bool
{
    $response = goldhall_supabase('DELETE', '/rest/v1/grievances', ['id' => 'eq.' . $id]);
    return $response['ok'];
}

function goldhall_reset_grievances(): bool
{
    /* PostgREST refuses an unfiltered DELETE, so match every row. */
    $response = goldhall_supabase('DELETE', '/rest/v1/grievances', ['id' => 'neq.']);
    return $response['ok'];
}

/* -------------------------------------------------------------------------
 * Polls and ballots
 * ---------------------------------------------------------------------- */

function goldhall_election(): array
{
    $response = goldhall_supabase('GET', '/rest/v1/elections', ['select' => '*', 'limit' => '1']);
    if ($response['ok'] && is_array($response['json']) && $response['json']) {
        $row = $response['json'][0];
        if (is_array($row)) {
            $positions = $row['positions'] ?? [];
            if (is_string($positions)) {
                $decoded = json_decode($positions, true);
                $positions = is_array($decoded) ? $decoded : [];
            }
            return [
                'title'     => (string) ($row['title'] ?? 'Gold Hall Student Polls'),
                'isOpen'    => (bool) ($row['is_open'] ?? true),
                'positions' => is_array($positions) ? $positions : [],
            ];
        }
    }
    return ['title' => 'Gold Hall Student Polls', 'isOpen' => true, 'positions' => []];
}

function goldhall_save_election(array $election): bool
{
    $positions = $election['positions'] ?? [];
    $response = goldhall_supabase(
        'POST',
        '/rest/v1/elections',
        ['on_conflict' => 'id'],
        [[
            'id'        => 'current',
            'title'     => (string) ($election['title'] ?? 'Gold Hall Student Polls'),
            'is_open'   => (bool) ($election['isOpen'] ?? true),
            'positions' => is_array($positions) ? array_values($positions) : [],
        ]],
        ['Prefer: resolution=merge-duplicates,return=minimal']
    );
    return $response['ok'];
}

/** Every ballot, as { studentId: { positionId: candidate } }. */
function goldhall_ballots(): array
{
    $response = goldhall_supabase('GET', '/rest/v1/ballots', ['select' => '*']);
    $votes = [];
    if ($response['ok'] && is_array($response['json'])) {
        foreach ($response['json'] as $row) {
            if (!is_array($row)) {
                continue;
            }
            $student = strtoupper((string) ($row['student_id'] ?? ''));
            $position = (string) ($row['position_id'] ?? '');
            if ($student === '' || $position === '') {
                continue;
            }
            $votes[$student][$position] = (string) ($row['candidate'] ?? '');
        }
    }
    return $votes;
}

/**
 * Cast one ballot.
 *
 * Returns false when that position has already been voted on by this student.
 * The primary key on (student_id, position_id) is what actually prevents it:
 * relying on a read-then-write check here would lose a race between two
 * tabs, and a browser-side check could be bypassed by clearing site data.
 */
function goldhall_cast_ballot(string $studentId, string $positionId, string $candidate): bool
{
    $studentId = strtoupper(trim($studentId));
    if ($studentId === '' || $positionId === '' || $candidate === '') {
        return false;
    }

    $response = goldhall_supabase(
        'POST',
        '/rest/v1/ballots',
        [],
        [[
            'student_id'  => $studentId,
            'position_id' => $positionId,
            'candidate'   => $candidate,
        ]],
        ['Prefer: resolution=ignore-duplicates,return=representation']
    );

    if (!$response['ok']) {
        return false;
    }
    /* ignore-duplicates returns nothing when the row already existed, so an
       empty body is the "already voted" signal. */
    return is_array($response['json']) ? count($response['json']) > 0 : true;
}

function goldhall_results(string $positionId): array
{
    $tally = [];
    foreach (goldhall_ballots() as $ballot) {
        if (isset($ballot[$positionId])) {
            $candidate = $ballot[$positionId];
            $tally[$candidate] = ($tally[$candidate] ?? 0) + 1;
        }
    }
    return $tally;
}
