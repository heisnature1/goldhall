<?php
/**
 * Template for the inner pages: Executives, Events, Gallery, About, Contact
 * and Student Life.
 *
 * A page sets $page_key (and optionally $nav_key) before including this file.
 * The hero copy comes from includes/pages.php, the cards from data/content.json.
 */

declare(strict_types=1);

require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/seed-content.php';
require_once __DIR__ . '/content.php';
require_once __DIR__ . '/pages.php';

$page_key = $page_key ?? 'about';
/* The nav entries hold pretty URL slugs, so the key matches those. */
$nav_key  = $nav_key ?? $page_key;
$page     = goldhall_page($page_key);

$page_title       = $page['title'] . ' | Gold Refinery Hall';
$page_description = $page['intro'];
$extra_styles     = ['page.css'];
$extra_scripts    = [];
$active_nav       = $nav_key;
/* Drives the per-page banner rules in page.css. */
$body_data        = 'data-page="' . goldhall_e($page_key) . '"';

/* Which items back this page. Executives/Events/Gallery come from the store;
   the rest render the static sections written in includes/pages.php. */
$managed = in_array($page_key, goldhall_content_types(), true);
$items   = $managed ? goldhall_items($page_key) : [];

[$explore_title, $explore_intro] = goldhall_page_intro($page_key);

require __DIR__ . '/head.php';
goldhall_loader();
require __DIR__ . '/header.php';
?>
<main>
    <section class="inner-hero">
        <div class="container">
            <span class="eyebrow"><?= goldhall_e($page['eyebrow']) ?></span>
            <h1><?= goldhall_e($page['title']) ?></h1>
            <p><?= goldhall_e($page['intro']) ?></p>
        </div>
    </section>

<?php if ($page_key === 'gallery') : ?>
    <?php $photos = array_values(array_filter($items, static fn (array $i): bool => goldhall_picture($i) !== '')); ?>
    <section class="page-section">
        <div class="container">
            <h2 class="page-title">Photos from the hall</h2>
            <p class="page-intro">Freshers’ welcome, hall week, sports, projects and everyday life at Gold Refinery Hall — updated by the Hall Administrator.</p>
<?php if ($photos) : ?>
            <div class="page-gallery">
<?php foreach ($photos as $photo) : ?>
<?php $picture = goldhall_picture($photo); ?>
                <figure class="page-gallery-item" data-caption="<?= goldhall_e($photo['title']) ?>">
                    <img src="<?= goldhall_e($picture) ?>" alt="<?= goldhall_e($photo['title']) ?>" loading="lazy" style="object-position: <?= goldhall_e(goldhall_position($photo)) ?>;">
                </figure>
<?php endforeach; ?>
            </div>
<?php else : ?>
            <p class="page-empty"><i class="fas fa-image"></i> No photos have been published yet. Check back soon.</p>
<?php endif; ?>
        </div>
    </section>
    <div class="page-lightbox" id="pageLightbox" hidden>
        <span class="page-lightbox-close" aria-label="Close">&times;</span>
        <img id="pageLightboxImg" alt="">
    </div>

<?php else : ?>
    <section class="page-section">
        <div class="container">
            <h2 class="page-title"><?= goldhall_e($explore_title) ?></h2>
            <p class="page-intro"><?= goldhall_e($explore_intro) ?></p>
            <div class="content-grid">
<?php if ($managed) : ?>
<?php foreach ($items as $item) : ?>
<?php $picture = goldhall_picture($item); ?>
                <article id="<?= goldhall_e((string) ($item['id'] ?? '')) ?>" class="content-card">
<?php if ($picture !== '') : ?>
                    <div class="content-media">
                        <img class="managed-image" src="<?= goldhall_e($picture) ?>" alt="<?= goldhall_e($item['title']) ?>" style="object-position: <?= goldhall_e(goldhall_position($item)) ?>;">
                    </div>
<?php else : ?>
                    <i class="fas fa-user-tie"></i>
<?php endif; ?>
                    <h3><?= goldhall_e($item['title']) ?></h3>
<?php if ($page_key === 'executives' && $item['meta'] !== '') : ?>
                    <p class="content-card-role"><?= goldhall_e($item['meta']) ?></p>
<?php endif; ?>
<?php if ($page_key !== 'executives') : ?>
                    <p class="content-card-meta"><?= goldhall_e($item['meta']) ?></p>
<?php endif; ?>
                    <p><?= nl2br(goldhall_e($item['text'])) ?></p>
<?php if ($item['link'] !== '') : ?>
                    <a class="content-card-link" href="<?= goldhall_e($item['link']) ?>"<?= goldhall_link_target($item['link']) ?>><?= goldhall_e(goldhall_link_label($page_key)) ?> <i class="fas fa-arrow-right"></i></a>
<?php endif; ?>
                </article>
<?php endforeach; ?>
<?php else : ?>
<?php foreach (($page['sections'] ?? []) as $section) : ?>
                <article id="<?= goldhall_e($section['id']) ?>" class="content-card">
                    <i class="fas <?= goldhall_e($section['icon']) ?>"></i>
                    <h3><?= goldhall_e($section['title']) ?></h3>
                    <p><?= goldhall_e($section['text']) ?></p>
                </article>
<?php endforeach; ?>
<?php endif; ?>
            </div>
        </div>
    </section>

<?php if ($page_key === 'about') : ?>
    <section class="page-section alt">
        <div class="container">
            <h2 class="page-title">Milestones</h2>
            <p class="page-intro">How a decommissioned gold refinery became one of UMaT's best-known halls of residence.</p>
            <ol class="history-timeline">
                <li>
                    <span class="year">Refinery era</span>
                    <p>The building was constructed and operated as a gold refinery, serving the mining industry around Tarkwa.</p>
                </li>
                <li>
                    <span class="year">September 2001</span>
                    <p>The decommissioned refinery was rehabilitated, repurposed and converted into a hall of residence for UMaT students.</p>
                </li>
                <li>
                    <span class="year">Today</span>
                    <p>The hall houses approximately 250 students on elevated ground at the northern edge of campus, with its own dining hall, kitchen and junior and senior common rooms.</p>
                </li>
            </ol>
        </div>
    </section>
<?php endif; ?>
<?php endif; ?>

    <section class="page-cta">
        <h2>Be part of our community</h2>
        <p>Gold Refinery Hall is more than a residence—it is a place to learn, lead and belong.</p>
        <a class="page-button" href="student">Open the Student Hub</a>
    </section>
</main>
<?php
$extra_scripts = ['pages.js'];
require __DIR__ . '/footer.php';
