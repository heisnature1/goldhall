<?php
/**
 * Small shared helpers.
 */

declare(strict_types=1);

/**
 * Read a local .env file into the environment.
 *
 * Most hosts (Vercel, cPanel, DigitalOcean) set real environment variables and
 * this does nothing. On a local PHP server there is no such thing, so a .env
 * file in the project root — never committed, see .gitignore — fills the gap.
 * Real environment variables always win.
 */
function goldhall_load_env(): void
{
    static $loaded = false;
    if ($loaded) {
        return;
    }
    $loaded = true;

    $path = dirname(__DIR__) . '/.env';
    if (!is_file($path)) {
        return;
    }

    $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key   = trim($key);
        $value = trim($value, " \t\"'");
        if ($key !== '' && getenv($key) === false) {
            putenv($key . '=' . $value);
        }
    }
}

goldhall_load_env();

/** Escape for HTML output. Every dynamic value goes through this. */
function goldhall_e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** True when a link points off-site, so it should open in a new tab. */
function goldhall_is_external(string $href): bool
{
    return (bool) preg_match('#^https?://#i', $href);
}

/** Attributes for a link that may be external. */
function goldhall_link_target(string $href): string
{
    return goldhall_is_external($href) ? ' target="_blank" rel="noopener noreferrer"' : '';
}

/** The picture for an item, checking the meta field too. */
function goldhall_picture(array $item): string
{
    $image = (string) ($item['image'] ?? '');
    if ($image !== '') {
        return $image;
    }
    $meta = (string) ($item['meta'] ?? '');
    return goldhall_is_picture($meta) ? $meta : '';
}

/** CSS object-position, defaulting to centred. */
function goldhall_position(array $item): string
{
    $position = trim((string) ($item['position'] ?? ''));
    return $position !== '' ? $position : '50% 50%';
}

/** Current script name, e.g. index.php. */
function goldhall_current_page(): string
{
    return basename((string) ($_SERVER['SCRIPT_NAME'] ?? 'index.php'));
}

/**
 * Small inline SVG used by the loader: the three gold rings around the crest.
 * Kept in PHP so every page renders the same markup.
 */
function goldhall_loader(): void
{
    ?>
  <div class="page-loader" id="pageLoader">
    <div class="loader-emblem" aria-hidden="true">
      <span class="loader-ring loader-ring-outer"></span>
      <span class="loader-ring loader-ring-mid"></span>
      <span class="loader-ring loader-ring-inner"></span>
      <span class="loader-glow"></span>
      <img class="loader-logo" src="assets/logo/gold-refinery-hall-logo.png" alt="Gold Refinery Hall logo">
    </div>
    <div class="loader-text">GOLD REFINERY HALL</div>
    <div class="loader-bar" aria-hidden="true"><span></span></div>
  </div>
    <?php
}
