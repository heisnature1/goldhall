<?php
/**
 * Refuse a members-only page to anyone not signed in to the Student Hub.
 *
 * Included at the very top of executives.php, events.php and gallery.php, before
 * any output, so a redirect is always possible. On refusal the visitor is sent to
 * the hub with ?next= the page they wanted, so signing in can return them there
 * instead of dumping them on the dashboard.
 *
 * This is a page-level gate and nothing more: it protects the rendered page, not
 * the JSON those pages read. api/content.php still serves that content to any
 * caller, exactly as it serves the home page and the admin portal. Closing it
 * means gating the endpoint too, which is a change to how the admin reads
 * content — deliberate, separate work.
 */

declare(strict_types=1);

require_once __DIR__ . '/members-only.php';

if (!goldhall_is_member()) {
    /* SCRIPT_NAME is the script (events.php) but the site speaks clean slugs
       (events), and student.js only honours the slug, so strip the extension. */
    $wanted = preg_replace('/\.php$/i', '', goldhall_current_page());
    $target = 'student' . ($wanted !== '' ? '?next=' . rawurlencode($wanted) : '');
    header('Location: ' . $target, true, 302);
    header('Cache-Control: no-store');
    exit;
}
