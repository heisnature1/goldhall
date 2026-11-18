<?php
/**
 * Content access for the Gold Hall site.
 *
 * All page content lives in one JSON file (data/content.json). That file is
 * created from includes/seed-content.php the first time it is needed, and the
 * admin portal writes back to it — so edits are shared by every visitor
 * instead of being trapped in one browser's localStorage.
 */

declare(strict_types=1);

/** Absolute path to the JSON store. */
function goldhall_data_file(): string
{
    return dirname(__DIR__) . '/data/content.json';
}

/** Absolute path to the upload directory used by the admin portal. */
function goldhall_upload_dir(): string
{
    return dirname(__DIR__) . '/assets/uploads';
}

/**
 * Give every item the keys the templates expect.
 *
 * Kept from the original store: older entries may lack link/image/label and
 * gallery pictures were sometimes saved into `meta`.
 *
 * @param  array<string, mixed> $item
 * @return array<string, mixed>
 */
function goldhall_normalise_item(array $item): array
{
    $item['link']     = $item['link'] ?? '';
    $item['image']    = $item['image'] ?? '';
    $item['label']    = $item['label'] ?? '';
    $item['position'] = $item['position'] ?? '';
    $item['meta']     = $item['meta'] ?? '';
    $item['text']     = $item['text'] ?? '';
    $item['title']    = $item['title'] ?? '';
    $item['published'] = (bool) ($item['published'] ?? true);

    // A picture pasted into the meta field for a gallery item.
    if (!empty($item['gallery']) && $item['image'] === '' && goldhall_is_picture((string) $item['meta'])) {
        $item['image'] = $item['meta'];
        $item['meta']  = '';
    }

    return $item;
}

/** True when a value looks like a usable image reference. */
function goldhall_is_picture(string $value): bool
{
    return (bool) preg_match('#^(https?:|data:image/|assets/)#i', trim($value));
}

/**
 * The full content array, each type keyed by a list of items.
 *
 * @return array<string, list<array<string, mixed>>>
 */
function goldhall_content(): array
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }

    $file = goldhall_data_file();
    $data = null;

    if (is_file($file)) {
        $raw  = file_get_contents($file);
        $data = $raw === false ? null : json_decode($raw, true);
    }

    if (!is_array($data)) {
        // First run (or a corrupt file): fall back to the seed.
        $data = goldhall_seed_content();
    }

    // Categories that no longer exist — keep them from resurfacing.
    unset($data['news'], $data['documents']);

    // Make sure every known type exists and is a list.
    $seed = goldhall_seed_content();
    foreach ($seed as $type => $items) {
        if (!isset($data[$type]) || !is_array($data[$type])) {
            $data[$type] = $items;
            continue;
        }
        // Top up entries that were added to the seed after this file was saved.
        $known = array_column($data[$type], 'id');
        foreach ($items as $item) {
            if (!in_array($item['id'], $known, true)) {
                $data[$type][] = $item;
            }
        }
    }

    foreach ($data as $type => $items) {
        if (!is_array($items)) {
            unset($data[$type]);
            continue;
        }
        $data[$type] = array_map('goldhall_normalise_item', $items);
    }

    return $cache = $data;
}

/**
 * Items of one type, published only by default.
 *
 * @return list<array<string, mixed>>
 */
function goldhall_items(string $type, bool $onlyPublished = true): array
{
    $items = goldhall_content()[$type] ?? [];
    if (!$onlyPublished) {
        return array_values($items);
    }
    return array_values(array_filter($items, static fn (array $item): bool => !empty($item['published'])));
}

/** The content types the admin portal can manage. */
function goldhall_content_types(): array
{
    return array_keys(goldhall_seed_content());
}

/**
 * Persist the whole content array.
 *
 * @param array<string, mixed> $data
 */
function goldhall_save_content(array $data): bool
{
    $file = goldhall_data_file();
    $dir  = dirname($file);
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        return false;
    }

    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        return false;
    }

    // Write to a temp file then rename, so a failed write cannot truncate the
    // live content file.
    $tmp = $file . '.tmp';
    if (file_put_contents($tmp, $json) === false) {
        return false;
    }
    return rename($tmp, $file);
}
