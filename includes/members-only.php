<?php
/**
 * Gate for the members-only pages: Executives, Events and Gallery.
 *
 * That content belongs to the Student Hub now and is shown only to a signed-in
 * student, so reaching it by typing the address has to fail too. This runs on
 * the server, before the page renders, and is the real boundary: robots.txt and
 * the sitemap only ask crawlers to stay away, they stop nobody.
 *
 * The session the hub keeps is the student id in browser sessionStorage. The
 * browser sends it as a cookie so the server can see it; page requests carry no
 * sessionStorage of their own. That cookie is set by the hub when a student
 * signs in and cleared when they sign out.
 *
 * Deliberately mirrors — and does not duplicate — the hub's check: the student
 * record must still exist and still be active, so a stale cookie cannot reopen
 * a page for someone whose access has since been ended.
 */

declare(strict_types=1);

require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/portal.php';

/** Name of the cookie mirroring the hub's session. Kept in step with student-hub.js. */
const GOLDHALL_SESSION_COOKIE = 'goldhall_student';

/** The student id this request carries, or '' when there is none. */
function goldhall_session_student_id(): string
{
    $raw = $_COOKIE[GOLDHALL_SESSION_COOKIE] ?? '';
    $id  = strtoupper(trim(rawurldecode((string) $raw)));
    // Student ids are digits; anything else is a forged or corrupted cookie.
    return preg_match('/^[A-Z0-9-]{1,40}$/', $id) === 1 ? $id : '';
}

/**
 * True when the request may see members-only content.
 *
 * Fails closed: if the roster cannot be reached the answer is no, because
 * showing the page to the wrong person is worse than showing it to nobody.
 */
function goldhall_is_member(): bool
{
    $id = goldhall_session_student_id();
    if ($id === '') {
        return false;
    }
    if (!goldhall_portal_ready()) {
        return false;
    }

    $student = goldhall_student($id);
    if ($student === null) {
        return false;
    }

    return ($student['accessStatus'] ?? '') === 'active';
}
