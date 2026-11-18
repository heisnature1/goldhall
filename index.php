<?php
/**
 * Home page.
 *
 * The executives, events and gallery sections are rendered here, on the
 * server, from data/content.json — the same content the admin portal edits.
 * Everything else is static markup.
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/seed-content.php';
require_once __DIR__ . '/includes/content.php';
require_once __DIR__ . '/includes/pages.php';

$page_title = 'Gold Refinery Hall - University of Mines and Technology';
$extra_styles = ['page.css'];
$extra_scripts = ['script.js'];
$page_description = 'Gold Refinery Hall, University of Mines and Technology, Tarkwa. Converted from a gold refinery in 2001, home to 250 students, building leaders since.';

$executives = goldhall_items('executives');
$events     = goldhall_items('events');
$gallery    = goldhall_items('gallery');

$home_executives = array_slice($executives, 0, 6);
$home_events     = array_slice($events, 0, 4);
$home_gallery    = array_slice($gallery, 0, 5);

require __DIR__ . '/includes/head.php';
goldhall_loader();
require __DIR__ . '/includes/header.php';
?>

    <!-- HERO SECTION -->
    <section class="hero" id="hero">
        <div class="hero-slider">
            <div class="hero-slide active">
                <img src="assets/images/hero/hero-hall-building.jpg" alt="Gold Refinery Hall building">
            </div>
            <div class="hero-slide">
                <img src="assets/images/hero/hero-campus-life.jpg" alt="Gold Refinery Hall residents in front of the hall">
            </div>
            <div class="hero-slide">
                <img src="assets/images/hero/hero-students.jpg" alt="Gold Refinery Hall students group photo">
            </div>
        </div>
        <div class="hero-overlay"></div>
        <div class="container">
            <div class="hero-content">
                <p class="welcome-text">Welcome to</p>
                <h2>Gold Refinery Hall</h2>
                <div class="hero-line"></div>
                <p class="university-name">University of Mines and Technology</p>
                <p class="hero-desc">A home away from home, where excellence is built, friendships are formed, and leaders are shaped.</p>
                <a href="#about" class="hero-btn">
                    Explore GoldHall <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
        <div class="hero-controls">
            <div class="hero-dot active" data-slide="0"></div>
            <div class="hero-dot" data-slide="1"></div>
            <div class="hero-dot" data-slide="2"></div>
        </div>
    </section>

    <!-- QUICK LINKS -->
    <section class="quick-links">
        <div class="container">
            <div class="quick-links-grid" data-reveal="zoom">
                <a href="student.php" class="quick-link-card animate-on-scroll">
                    <div class="quick-link-icon"><i class="fas fa-graduation-cap"></i></div>
                    <div class="quick-link-text"><h4>Scholarship links</h4><p>Explore funding opportunities</p></div>
                </a>
                <a href="contact.php" class="quick-link-card animate-on-scroll">
                    <div class="quick-link-icon"><i class="fas fa-envelope-open-text"></i></div>
                    <div class="quick-link-text"><h4>Contact the Hall</h4><p>Get support from the office</p></div>
                </a>
                <a href="events.php" class="quick-link-card animate-on-scroll">
                    <div class="quick-link-icon"><i class="fas fa-calendar-check"></i></div>
                    <div class="quick-link-text"><h4>Upcoming Events</h4><p>View hall programmes</p></div>
                </a>
                <a href="gallery.php" class="quick-link-card animate-on-scroll">
                    <div class="quick-link-icon"><i class="fas fa-images"></i></div>
                    <div class="quick-link-text"><h4>Hall Gallery</h4><p>Photos from the hall</p></div>
                </a>
            </div>
        </div>
    </section>

    <!-- STUDENT HUB -->
    <section class="hub-spotlight" id="student-hub">
        <div class="container hub-spotlight-inner">
            <div class="hub-spotlight-copy" data-reveal="left">
                <span class="section-badge">The Gold Hall Student Hub</span>
                <h2>Everything student life,<br><em>all in one place.</em></h2>
                <p>Scholarships, internships, tutorials, campus shuttle information, hall announcements and free student polls—built for every year group.</p>
                <div class="hub-spotlight-actions">
                    <a href="student.php" class="hub-spotlight-button">Sign in or register <i class="fas fa-arrow-right"></i></a>
                    <span><i class="fas fa-graduation-cap"></i> Access ends when you complete school</span>
                </div>
            </div>
            <div class="hub-spotlight-cards" data-reveal="right" style="--fx-delay:.12s">
                <a href="student.php"><i class="fas fa-award"></i><span><strong>Opportunities</strong><small>Scholarships & internships</small></span><i class="fas fa-arrow-up-right-from-square"></i></a>
                <a href="student.php"><i class="fas fa-bus-simple"></i><span><strong>Campus essentials</strong><small>Schedules & tutorials</small></span><i class="fas fa-arrow-up-right-from-square"></i></a>
                <a href="student.php"><i class="fas fa-check-to-slot"></i><span><strong>Student voice</strong><small>Free hall polls & elections</small></span><i class="fas fa-arrow-up-right-from-square"></i></a>
            </div>
        </div>
    </section>

    <!-- ABOUT SECTION -->
    <section class="about-section" id="about">
        <div class="container">
            <div class="section-header animate-on-scroll" data-reveal="hinge">
                <span class="section-badge">About Us</span>
                <h2>Our Heritage & Legacy</h2>
                <div class="underline"></div>
            </div>
            <div class="about-grid">
                <div class="about-image animate-on-scroll">
                    <img src="assets/images/hero/hero-hall-building.jpg" alt="Gold Refinery Hall building">
                    <div class="about-image-overlay">
                        <div class="year">Est. 2001</div>
                        <p>A legacy of excellence</p>
                    </div>
                </div>
                <div class="about-text animate-on-scroll">
                    <h3>Building Leaders Since 2001</h3>
                    <p>Gold Refinery Hall began life as a working gold refinery, tied to the mining heritage of the Western Region of Ghana. In September 2001 the decommissioned refinery building was rehabilitated and converted into a hall of residence — a transformation that still defines the hall's character.</p>
                    <p>Home to approximately 250 students, the hall sits on elevated ground on the northern outskirts of the UMaT campus, where residents climb more than 200 stairs to reach it. Its own dining hall and kitchen, together with junior and senior common rooms, make it a complete home away from home.</p>
                    <div class="about-features">
                        <div class="about-feature">
                            <i class="fas fa-check-circle"></i>
                            <span>Academic Excellence</span>
                        </div>
                        <div class="about-feature">
                            <i class="fas fa-check-circle"></i>
                            <span>Leadership Training</span>
                        </div>
                        <div class="about-feature">
                            <i class="fas fa-check-circle"></i>
                            <span>Sports & Recreation</span>
                        </div>
                        <div class="about-feature">
                            <i class="fas fa-check-circle"></i>
                            <span>Cultural Activities</span>
                        </div>
                    </div>
                    <a href="about.php" class="about-btn">
                        Learn More <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- STATS SECTION -->
    <section class="stats-section">
        <div class="container">
            <div class="stats-grid">
                <div class="stat-item animate-on-scroll">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-number" data-count="250">0</div>
                    <div class="stat-label">Current Residents</div>
                </div>
                <div class="stat-item animate-on-scroll">
                    <div class="stat-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="stat-number" data-count="45">0</div>
                    <div class="stat-label">Awards Won</div>
                </div>
                <div class="stat-item animate-on-scroll">
                    <div class="stat-icon">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <div class="stat-number" data-count="8500">0</div>
                    <div class="stat-label">Alumni Network</div>
                </div>
                <div class="stat-item animate-on-scroll">
                    <div class="stat-icon">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <div class="stat-number" data-count="25">0</div>
                    <div class="stat-label">Years of Excellence</div>
                </div>
            </div>
        </div>
    </section>
    <!-- LEADERSHIP SECTION -->
    <section class="leadership-section" id="leadership">
        <div class="container">
            <div class="section-header animate-on-scroll" data-reveal="hinge">
                <span class="section-badge">Executives</span>
                <h2>Meet Our Executives</h2>
                <div class="underline"></div>
            </div>
            <div class="leadership-grid" data-executives>
<?php if ($home_executives) : ?>
<?php foreach ($home_executives as $person) : ?>
<?php $picture = goldhall_picture($person); ?>
                <div class="leader-card animate-on-scroll">
                    <div class="leader-image">
<?php if ($picture !== '') : ?>
                        <img src="<?= goldhall_e($picture) ?>" alt="<?= goldhall_e($person['title']) ?>" style="object-position: <?= goldhall_e(goldhall_position($person)) ?>;">
<?php else : ?>
                        <div class="leader-image-fallback"><i class="fas fa-user-tie"></i></div>
<?php endif; ?>
                        <div class="leader-image-overlay"></div>
                    </div>
                    <div class="leader-info">
                        <h3><?= goldhall_e($person['title']) ?></h3>
<?php if ($person['meta'] !== '') : ?>
                        <p class="position"><?= goldhall_e($person['meta']) ?></p>
<?php endif; ?>
                        <p><?= goldhall_e($person['text']) ?></p>
                        <div class="leader-social">
<?php if ($person['link'] !== '') : ?>
                            <a href="<?= goldhall_e($person['link']) ?>"<?= goldhall_link_target($person['link']) ?> title="Profile link"><i class="fas fa-link"></i></a>
<?php endif; ?>
                            <a href="#" title="Email"><i class="fas fa-envelope"></i></a>
                            <a href="#" title="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                        </div>
                    </div>
                </div>
<?php endforeach; ?>
<?php else : ?>
                <p>No executives have been published yet.</p>
<?php endif; ?>
            </div>
<?php if (count($executives) > count($home_executives)) : ?>
            <p class="leaders-more"><a href="executives.php">Meet all <?= count($executives) ?> executives <i class="fas fa-arrow-right"></i></a></p>
<?php endif; ?>
        </div>
    </section>

    <!-- EVENTS SECTION -->
    <section class="events-section" id="events">
        <div class="container">
            <div class="section-header animate-on-scroll" data-reveal="hinge">
                <span class="section-badge">Events</span>
                <h2>Upcoming Events</h2>
                <div class="underline"></div>
            </div>
            <div class="events-grid">
<?php if ($home_events) : ?>
<?php foreach ($home_events as $event) : ?>
                <article class="event-card animate-on-scroll">
                    <div class="event-date-block">
                        <span class="month">EVENT</span>
                        <span class="day"><i class="fas fa-calendar"></i></span>
                    </div>
                    <div class="event-details">
                        <h3><?= goldhall_e($event['title']) ?></h3>
                        <p><?= goldhall_e($event['text']) ?></p>
                        <div class="event-meta">
                            <span><i class="fas fa-map-marker-alt"></i> <?= goldhall_e($event['meta']) ?></span>
                        </div>
<?php if ($event['link'] !== '') : ?>
                        <a href="<?= goldhall_e($event['link']) ?>" class="news-link"<?= goldhall_link_target($event['link']) ?>>Event details <i class="fas fa-arrow-right"></i></a>
<?php endif; ?>
                    </div>
                </article>
<?php endforeach; ?>
<?php else : ?>
                <p>No published events at the moment.</p>
<?php endif; ?>
            </div>
        </div>
    </section>

    <!-- GALLERY SECTION -->
    <section class="gallery-section" id="gallery">
        <div class="container">
            <div class="section-header animate-on-scroll" data-reveal="hinge">
                <span class="section-badge">Gallery</span>
                <h2>Life at Gold Hall</h2>
                <div class="underline"></div>
            </div>
            <div class="gallery-grid">
<?php if ($home_gallery) : ?>
<?php foreach ($home_gallery as $photo) : ?>
<?php $picture = goldhall_picture($photo); ?>
                <div class="gallery-item animate-on-scroll" onclick="openLightbox(this)">
                    <img src="<?= goldhall_e($picture) ?>" alt="<?= goldhall_e($photo['title']) ?>" style="object-position: <?= goldhall_e(goldhall_position($photo)) ?>;">
                    <div class="gallery-overlay">
                        <i class="fas fa-search-plus"></i>
                    </div>
                </div>
<?php endforeach; ?>
<?php else : ?>
                <p>No published gallery items at the moment.</p>
<?php endif; ?>
            </div>
        </div>
    </section>

    <!-- CTA SECTION -->
    <section class="cta-section">
        <div class="container">
            <div class="cta-content animate-on-scroll">
                <h2>Join the Gold Refinery Family</h2>
                <p>Experience the best of university life at Gold Refinery Hall. From academic support to vibrant social activities, we have everything you need to thrive.</p>
                <div class="cta-buttons">
                    <a href="student.php" class="cta-btn-primary">
                        <i class="fas fa-user-plus"></i> Open Student Hub
                    </a>
                    <a href="about.php" class="cta-btn-secondary">
                        <i class="fas fa-info-circle"></i> Learn More
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- BACK TO TOP -->
    <button class="back-to-top" id="backToTop" aria-label="Back to top">
        <i class="fas fa-chevron-up"></i>
    </button>

    <!-- LIGHTBOX -->
    <div class="lightbox" id="lightbox">
        <span class="lightbox-close" onclick="closeLightbox()">&times;</span>
        <img id="lightboxImg" src="" alt="Gallery Image">
    </div>
<?php require __DIR__ . '/includes/footer.php'; ?>
