<?php
/**
 * Sitemap and robots.txt.
 *
 *   api/sitemap.php            -> /sitemap.xml
 *   api/sitemap.php?type=robots -> /robots.txt
 *
 * Generated rather than checked in as files: vercel.json sends every path that
 * is not under api/ to the page router, so a static sitemap.xml in the project
 * root would never be served. It would be answered with the home page instead,
 * which is worse than no sitemap at all because it reads as a 200.
 *
 * Generated also keeps it honest: only pages that actually exist and are public
 * are listed, and the private ones are absent by construction rather than by
 * remembering to leave them out.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/functions.php';

/* Absolute URLs are required by the sitemap spec, so the host has to be known. */
$site = goldhall_site_url();

/* Every page people may find, in the order they matter. Each entry is the path
   as the site serves it, a priority, and how often it changes.
 *
 * Deliberately absent: /admin, /dashboard, /reset-password and /confirm-email.
 * They are sign-in surfaces with nothing to index, and the first two are
 * private. /student is listed because it is the public way into the hub; the
 * hub itself (/dashboard) is not. */
$pages = [
    ['/index',      '1.0', 'weekly'],
    ['/about',      '0.8', 'monthly'],
    ['/executives', '0.8', 'monthly'],
    ['/events',     '0.9', 'weekly'],
    ['/gallery',    '0.7', 'monthly'],
    ['/contact',    '0.6', 'yearly'],
    ['/students',   '0.6', 'monthly'],
];

/* Which of the two outputs is wanted.
 *
 * Decided from ?type= and, as a fallback, from the address that was actually
 * requested. vercel.json rewrites /robots.txt to this file with ?type=robots,
 * but a rewrite is not guaranteed to carry that query string through on every
 * host, and if it did not, /robots.txt would quietly answer with XML. Reading
 * the original URI as well makes the answer correct either way. */
$type   = strtolower(trim((string) ($_GET['type'] ?? '')));
$origin = '';
foreach (['HTTP_X_ORIGINAL_URL', 'ORIGINAL_URL', 'REQUEST_URI'] as $key) {
    if (!empty($_SERVER[$key])) {
        $origin = strtolower((string) $_SERVER[$key]);
        break;
    }
}
if ($type === 'robots' || str_contains($origin, 'robots.txt')) {
    $type = 'robots';
}

/* ---------------------------------------------------------------- robots.txt */
if ($type === 'robots') {
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: public, max-age=3600');

    echo "User-agent: *\n";
    echo "Allow: /\n";
    /* Crawling these wastes the budget and can surface a sign-in form in the
       results, which helps nobody. */
    echo "Disallow: /admin\n";
    echo "Disallow: /dashboard\n";
    echo "Disallow: /reset-password\n";
    echo "Disallow: /confirm-email\n";
    echo "Disallow: /api/\n";
    echo "\n";
    echo 'Sitemap: ' . $site . "/sitemap.xml\n";
    exit;
}

/* ---------------------------------------------------------------- sitemap.xml */
/* No <lastmod>. It has to be the date the page last actually changed, and this
   endpoint has no way to know that: stamping today's date on every request is a
   false signal, and Google learns to ignore a sitemap that always claims to be
   fresh. Omitting it is honest and perfectly valid. */

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

foreach ($pages as [$path, $priority, $frequency]) {
    echo "  <url>\n";
    echo '    <loc>' . goldhall_e($site . $path) . "</loc>\n";
    echo '    <changefreq>' . $frequency . "</changefreq>\n";
    echo '    <priority>' . $priority . "</priority>\n";
    echo "  </url>\n";
}

echo "</urlset>\n";
