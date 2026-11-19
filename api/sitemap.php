<?php
/**
 * Sitemap, served at /sitemap.xml.
 *
 * Why this is PHP and not a static sitemap.xml:
 *
 * The site answers on more than one host — www.goldrefineryhall-umat.com and
 * goldhall.vercel.app. Google requires every URL in a sitemap to be on the SAME
 * host as the sitemap file, otherwise it reports "URL not allowed". A file with
 * the host written into it is therefore wrong on whichever host it was not
 * written for, and that is exactly the error that came back when the domain was
 * connected.
 *
 * So the host is taken from the request. The file served at
 * https://www.goldrefineryhall-umat.com/sitemap.xml lists www.goldrefineryhall-umat.com
 * URLs, and the one served at goldhall.vercel.app lists vercel.app URLs. Both are
 * valid at their own location.
 *
 * It must be reachable at the ROOT as /sitemap.xml. A sitemap under a
 * subdirectory may only list URLs at that level or below, so one at
 * /api/sitemap.php would have every page rejected as "higher level". See the
 * rewrite in vercel.json that maps /sitemap.xml here.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/functions.php';

$site = goldhall_site_url();

/* Public pages only, in the order they matter.
 *
 * Absent: /admin and /dashboard are private; /reset-password and /confirm-email
 * are transient sign-in steps with nothing to index. */
$pages = [
    ['/index',      '1.0', 'weekly'],
    ['/events',     '0.9', 'weekly'],
    ['/about',      '0.8', 'monthly'],
    ['/executives', '0.8', 'monthly'],
    ['/gallery',    '0.7', 'monthly'],
    ['/student',    '0.6', 'monthly'],
    ['/students',   '0.6', 'monthly'],
    ['/contact',    '0.6', 'yearly'],
];

if (!headers_sent()) {
    http_response_code(200);
}

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
