<?php
/**
 * Shared <head> and opening <body>.
 *
 * Expects $page_title, optional $page_description and $body_class /
 * $body_data before being included.
 */

declare(strict_types=1);

$page_title       = $page_title ?? 'Gold Refinery Hall - University of Mines and Technology';
$page_description = $page_description ?? 'Gold Refinery Hall, University of Mines and Technology, Tarkwa. A hall of residence building leaders, fostering excellence and creating lasting bonds since 2001.';
$body_class       = $body_class ?? '';
$body_data        = $body_data ?? '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="assets/logo/gold-hall-favicon.png">
    <link rel="apple-touch-icon" href="assets/logo/gold-hall-favicon.png">
    <title><?= goldhall_e($page_title) ?></title>
    <meta name="description" content="<?= goldhall_e($page_description) ?>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="stylesheet" href="styles.css">
<?php if (!empty($extra_styles)) : ?>
<?php foreach ((array) $extra_styles as $href) : ?>
    <link rel="stylesheet" href="<?= goldhall_e($href) ?>">
<?php endforeach; ?>
<?php endif; ?>
    <link rel="stylesheet" href="enhancements.css">
<?php
/* Declare the canonical URL of this page.
 *
 * The home page is reachable as /, /index and /index.php, and vercel.json
 * redirects the last two to /index. Without a canonical tag a search engine
 * sees three addresses for one page and has to guess which to rank, which
 * splits whatever authority the page has. Private pages are excluded so they
 * never advertise themselves. */
$canonical_map = [
    'index.php'          => '/index',
    'about.php'          => '/about',
    'executives.php'     => '/executives',
    'events.php'         => '/events',
    'gallery.php'        => '/gallery',
    'contact.php'        => '/contact',
    'students.php'       => '/students',
    'student.php'        => '/student',
];
$canonical_page = goldhall_current_page();
/* One canonical host, whatever address the visitor arrived on.
 *
 * The site answers on three: the domain with www, the domain without it, and
 * the vercel.app address. vercel.json redirects the last two, but a canonical
 * tag states it too, so a search engine consolidates on www even if it discovered
 * a page before the redirect existed. Set GOLDHALL_SITE_URL to override. */
$canonical_host = getenv('GOLDHALL_SITE_URL');
$canonical_host = is_string($canonical_host) && trim($canonical_host) !== ''
    ? rtrim(trim($canonical_host), '/')
    : goldhall_site_url();
if (isset($canonical_map[$canonical_page])) :
?>
    <link rel="canonical" href="<?= goldhall_e($canonical_host . $canonical_map[$canonical_page]) ?>">
<?php endif; ?>
    <meta property="og:site_name" content="Gold Refinery Hall, UMaT">
    <meta property="og:type" content="website">
    <meta property="og:title" content="<?= goldhall_e($page_title) ?>">
    <meta property="og:description" content="<?= goldhall_e($page_description) ?>">
    <meta name="twitter:card" content="summary_large_image">
</head>
<body class="<?= goldhall_e($body_class) ?>"<?= $body_data !== '' ? ' ' . $body_data : '' ?>>
