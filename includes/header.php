<?php
/**
 * Top bar, masthead and primary navigation.
 *
 * $active_nav is the script name of the current page (index.php, about.php…)
 * so the matching tab gets .active. Omit it on pages outside the main menu.
 */

declare(strict_types=1);

/* $active_nav is the current page's script name (about.php). The nav entries
   now hold pretty URL slugs (about), so reduce it to a comparable slug. */
$active_page = $active_nav ?? goldhall_current_page();
$active_slug = preg_replace('/\.php$/i', '', (string) $active_page);

if ($active_slug === 'index') {
    $active_slug = '';
}
$is_home = $active_slug === '';

$admin_logo = 'assets/logo/pius-tweneboah-administration-logo.png';
?>
<!-- TOP BAR -->
<div class="top-bar">
    <div class="container">
        <div class="top-bar-left">
            <i class="fas fa-map-marker-alt"></i>
            <span>University of Mines and Technology, Tarkwa</span>
        </div>
        <div class="top-bar-right">
            <em>Excellence · Unity · Leadership</em>
        </div>
        <div class="top-bar-social">
            <a href="#" title="Facebook" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
            <a href="#" title="Twitter" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
            <a href="#" title="Instagram" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            <a href="#" title="YouTube" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
        </div>
    </div>
</div>

<!-- HEADER -->
<header class="header" id="header">
    <div class="container">
        <a class="logo-section" href="./">
            <div class="logo-img">
                <img src="assets/logo/gold-refinery-hall-logo.png" alt="Gold Refinery Hall logo">
            </div>
            <div class="logo-text">
<?php if ($is_home) : ?>
                <h1>GOLD<br>REFINERY<br>HALL</h1>
<?php else : ?>
                <h1>GOLD REFINERY HALL</h1>
<?php endif; ?>
                <p>University of Mines and Technology</p>
            </div>
        </a>

        <div class="header-right">
            <div class="header-divider"></div>
            <div class="admin-section">
                <div class="admin-icon">
                    <img src="<?= goldhall_e($admin_logo) ?>" alt="Pius and Tweneboah administration logo">
                </div>
                <div class="admin-text">
<?php if ($is_home) : ?>
                    <h3>PIUS-<br>TWENEBOAH</h3>
                    <p>LED ADMINISTRATION</p>
<?php else : ?>
                    <h3>Gold Hall</h3>
                    <p>UMaT, Tarkwa</p>
<?php endif; ?>
                </div>
            </div>
        </div>

        <button class="hamburger" id="hamburger" aria-label="Toggle menu" aria-expanded="false">
            <span></span>
            <span></span>
            <span></span>
        </button>
    </div>
</header>

<!-- MOBILE OVERLAY -->
<div class="mobile-overlay" id="mobileOverlay"></div>

<!-- NAVIGATION -->
<nav class="nav-section" id="navSection" aria-label="Primary navigation">
    <button class="mobile-nav-close" id="mobileNavClose" aria-label="Close menu">
        <i class="fas fa-times"></i>
    </button>
    <div class="container">
        <ul class="main-nav">
<?php foreach (goldhall_nav() as [$label, $href, $icon]) : ?>
<?php
    $classes = [];
    if ($href === 'student') {
        $classes[] = 'nav-highlight';
    }
    $is_current = $href === $active_slug;
    if ($is_current) {
        $classes[] = 'active';
    }
?>
            <li>
                <a href="<?= goldhall_e($href === '' ? './' : $href) ?>"<?= $classes ? ' class="' . goldhall_e(implode(' ', $classes)) . '"' : '' ?><?= $is_current ? ' aria-current="page"' : '' ?>>
                    <i class="fas <?= goldhall_e($icon) ?>" aria-hidden="true"></i><?= goldhall_e($label) ?>
                </a>
            </li>
<?php endforeach; ?>
        </ul>
        <div class="login-btn" id="loginMenu">
            <button class="btn" type="button" aria-haspopup="true" aria-expanded="false">
                <i class="fas fa-right-to-bracket btn-icon-lead" aria-hidden="true"></i><span>Login</span><i class="fas fa-chevron-down btn-icon-caret" aria-hidden="true"></i>
            </button>
            <div class="login-dropdown" role="menu" aria-label="Login options">
                <a href="student" role="menuitem"><i class="fas fa-user-graduate" aria-hidden="true"></i><span>Sign in to Student Hub</span></a>
                <a href="admin" role="menuitem"><i class="fas fa-user-tie" aria-hidden="true"></i><span>Admin Portal</span></a>
            </div>
        </div>
    </div>
</nav>
