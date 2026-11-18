<?php
/**
 * Content access for the Gold Hall site.
 *
 * Two backends, chosen automatically:
 *
 *   1. Supabase, when GOLDHALL_SUPABASE_URL and GOLDHALL_SUPABASE_KEY are set.
 *      Needed on serverless hosts (Vercel), where the filesystem is read-only.
 *   2. A JSON file (data/content.json) otherwise — created from
 *      includes/seed-content.php on first use.
 *
 * Both are seeded from includes/seed-content.php, so the site looks identical
 * either way and switching backend changes nothing for visitors or templates.
 */

declare(strict_types=1);

require_once __DIR__ . '/supabase.php';

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

/* ==========================================================================
   Supabase backend
   ========================================================================== */

/** A content row from Supabase, shaped like the JSON-file items. */
function goldhall_row_to_item(array $row): array
{
    return [
        'id'        => (string) ($row['id'] ?? ''),
        'title'     => (string) ($row['title'] ?? ''),
        'text'      => (string) ($row['text'] ?? ''),
        'meta'      => (string) ($row['meta'] ?? ''),
        'link'      => (string) ($row['link'] ?? ''),
        'label'     => (string) ($row['label'] ?? ''),
        'image'     => (string) ($row['image'] ?? ''),
        'position'  => (string) ($row['position'] ?? ''),
        'published' => (bool) ($row['published'] ?? true),
    ];
}

/** An item shaped for the content_items table. */
function goldhall_item_to_row(string $type, array $item): array
{
    return [
        'id'        => (string) ($item['id'] ?? ''),
        'type'      => $type,
        'title'     => (string) ($item['title'] ?? ''),
        'text'      => (string) ($item['text'] ?? ''),
        'meta'      => (string) ($item['meta'] ?? ''),
        'link'      => (string) ($item['link'] ?? ''),
        'label'     => (string) ($item['label'] ?? ''),
        'image'     => (string) ($item['image'] ?? ''),
        'position'  => (string) ($item['position'] ?? ''),
        'published' => (bool) ($item['published'] ?? true),
    ];
}

/**
 * Read all content from Supabase, grouped by type.
 *
 * Returns null when the request fails, so callers can fall back to the seed
 * rather than showing an empty site.
 *
 * @return array<string, list<array<string, mixed>>>|null
 */
function goldhall_supabase_read(): ?array
{
    $response = goldhall_supabase('GET', '/rest/v1/content_items', [
        'select' => 'id,type,title,text,meta,link,label,image,position,published',
        'order'  => 'type.asc,sort.asc',
    ]);

    if (!$response['ok'] || !is_array($response['json'])) {
        return null;
    }

    $grouped = [];
    foreach ($response['json'] as $row) {
        if (!is_array($row)) {
            continue;
        }
        $type = (string) ($row['type'] ?? '');
        if ($type === '') {
            continue;
        }
        $grouped[$type][] = goldhall_row_to_item($row);
    }

    return $grouped;
}

/**
 * Upsert many rows in one request.
 *
 * Used when the JSON-file backend hands over a whole content array; the admin
 * endpoints write single rows instead (see goldhall_supabase_save()).
 *
 * @param list<array<string, mixed>> $rows
 */
function goldhall_supabase_upsert_rows(array $rows): bool
{
    if (!$rows) {
        return true;
    }

    $response = goldhall_supabase(
        'POST',
        '/rest/v1/content_items',
        ['on_conflict' => 'id'],
        $rows,
        ['Prefer: resolution=merge-duplicates,return=minimal']
    );

    return $response['ok'];
}

/**
 * Insert or update one item.
 *
 * `sort` decides the order inside a section, and the site reads
 * `order by type, sort`. The row builder does not carry it, so it has to be
 * set here: without it every save upserted the column back to its default of
 * 0, which sent the item to the top of its section. That looked like the admin
 * form had a mind of its own: a typo fix would promote an executive above
 * the President.
 *
 * A new item takes the lowest sort value in its section, so it appears first;
 * an existing item keeps the value it already had.
 */
function goldhall_supabase_save(string $type, array $item): bool
{
    /* The admin form sends a data URL for a freshly picked picture. On the
       file backend that is fine (the JSON file is small and local), but in the
       database it would bloat every row, so move the bytes to Storage. */
    if (!empty($item['image']) && str_starts_with((string) $item['image'], 'data:image/')) {
        $stored = goldhall_supabase_upload_data_url((string) $item['image']);
        if ($stored['url'] === '') {
            return false;
        }
        $item['image'] = $stored['url'];
    }

    $row = goldhall_item_to_row($type, $item);
    $row['sort'] = goldhall_supabase_sort_for($type, (string) $row['id']);

    $response = goldhall_supabase(
        'POST',
        '/rest/v1/content_items',
        ['on_conflict' => 'id'],
        [$row],
        ['Prefer: resolution=merge-duplicates,return=minimal']
    );

    return $response['ok'];
}

/**
 * The `sort` value to store for one item.
 *
 * Existing items keep their position. A new one is placed first, at one below
 * the current minimum, which leaves the other rows untouched.
 *
 * A failed read falls back to 0 rather than blocking the save: an item landing
 * in the wrong place is a nuisance, losing the edit is worse.
 */
function goldhall_supabase_sort_for(string $type, string $id): int
{
    $response = goldhall_supabase('GET', '/rest/v1/content_items', [
        'select' => 'id,sort',
        'type'   => 'eq.' . $type,
        'order'  => 'sort.asc',
    ]);

    if (!$response['ok'] || !is_array($response['json'])) {
        return 0;
    }

    $lowest = null;
    foreach ($response['json'] as $row) {
        if (!is_array($row)) {
            continue;
        }
        if ((string) ($row['id'] ?? '') === $id) {
            return (int) ($row['sort'] ?? 0);
        }
        $sort = (int) ($row['sort'] ?? 0);
        $lowest = $lowest === null ? $sort : min($lowest, $sort);
    }

    return $lowest === null ? 0 : $lowest - 1;
}

/** Delete one item by id. */
function goldhall_supabase_delete(string $type, string $id): bool
{
    $response = goldhall_supabase('DELETE', '/rest/v1/content_items', [
        'type' => 'eq.' . $type,
        'id'   => 'eq.' . $id,
    ]);

    return $response['ok'];
}

/**
 * Create the table and insert the seed content.
 *
 * Supabase's REST API cannot run DDL, so the table itself has to be created
 * once (see supabase-schema.sql). This only fills an empty table.
 *
 * @return array{ok:bool,message:string}
 */
function goldhall_supabase_seed(): array
{
    $existing = goldhall_supabase('GET', '/rest/v1/content_items', ['select' => 'id', 'limit' => '1']);
    if (!$existing['ok']) {
        return ['ok' => false, 'message' => 'Could not reach the content_items table: ' . $existing['error']];
    }
    if (is_array($existing['json']) && count($existing['json']) > 0) {
        return ['ok' => true, 'message' => 'Content already present — nothing to import.'];
    }

    $rows = [];
    $sort = 0;
    foreach (goldhall_seed_content() as $type => $items) {
        foreach ($items as $item) {
            $row = goldhall_item_to_row($type, $item);
            $row['sort'] = $sort++;
            $rows[] = $row;
        }
    }

    if (!$rows) {
        return ['ok' => true, 'message' => 'The seed is empty.'];
    }

    $response = goldhall_supabase(
        'POST',
        '/rest/v1/content_items',
        [],
        $rows,
        ['Prefer: resolution=merge-duplicates,return=minimal']
    );

    if (!$response['ok']) {
        return ['ok' => false, 'message' => 'Import failed: ' . $response['error']];
    }

    return ['ok' => true, 'message' => count($rows) . ' items imported into Supabase.'];
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

    $data = null;

    if (goldhall_uses_supabase()) {
        static $seeded = false;

        $data = goldhall_supabase_read();

        /* An empty table means setup has not been done yet: fill it once from
           the seed file, then read again. A *failed* read stays null and falls
           through to the local seed, so a Supabase outage never blanks the
           site. */
        if ($data === [] && !$seeded) {
            $seeded = true;
            goldhall_supabase_seed();
            $data = goldhall_supabase_read();
            if ($data === []) {
                $data = null;
            }
        }
    }

    if (!is_array($data)) {
        $file = goldhall_data_file();
        if (is_file($file)) {
            $raw  = file_get_contents($file);
            $data = $raw === false ? null : json_decode($raw, true);
        }
    }

    if (!is_array($data)) {
        // First run (or a corrupt file): fall back to the seed.
        $data = goldhall_seed_content();
    }

    // Categories that no longer exist — keep them from resurfacing.
    unset($data['news'], $data['documents']);

    /* Ids the administrator deleted. Without this, the top-up below would put
       a deleted seed item straight back on the next page load. */
    $deleted = [];
    if (!empty($data['_deleted']) && is_array($data['_deleted'])) {
        $deleted = array_map('strval', $data['_deleted']);
    }
    unset($data['_deleted']);

    // Make sure every known type exists and is a list. Supabase is the source
    // of truth once seeded, so only the local file is topped up.
    if (!goldhall_uses_supabase()) {
        $seed = goldhall_seed_content();
        foreach ($seed as $type => $items) {
            if (!isset($data[$type]) || !is_array($data[$type])) {
                $data[$type] = $items;
                continue;
            }
            // Top up entries that were added to the seed after this file was saved.
            $known = array_column($data[$type], 'id');
            foreach ($items as $item) {
                if (!in_array($item['id'], $known, true) && !in_array((string) $item['id'], $deleted, true)) {
                    $data[$type][] = $item;
                }
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

    /* Put the tombstones back: goldhall_save_content() writes this array out,
       so they have to survive the round trip. */
    if ($deleted) {
        $data['_deleted'] = $deleted;
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
    /* Supabase configured: write the row list there instead of the file. */
    if (goldhall_uses_supabase()) {
        $rows = [];
        $sort = 0;
        foreach ($data as $type => $items) {
            // `_deleted` is a list of ids, not a content type.
            if (!is_array($items) || str_starts_with((string) $type, '_')) {
                continue;
            }
            foreach ($items as $item) {
                if (!is_array($item)) {
                    continue;
                }
                $row = goldhall_item_to_row((string) $type, $item);
                $row['sort'] = $sort++;
                $rows[] = $row;
            }
        }
        return goldhall_supabase_upsert_rows($rows);
    }

    $file = goldhall_data_file();
    $dir  = dirname($file);
    if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
        return false;
    }
    /* A serverless host (Vercel, Lambda) ships a read-only filesystem, so the
       write can never succeed there. Say so plainly rather than failing
       silently — see README "Hosting". */
    if (!is_writable(is_file($file) ? $file : $dir)) {
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

/**
 * A message that tells the truth about why a save failed.
 *
 * On Vercel (and other serverless hosts) the project filesystem is read-only,
 * so content editing needs an external store. Rather than a generic
 * "permission denied", say what is actually wrong.
 */
function goldhall_write_error(?string $detail = ''): string
{
    if (goldhall_uses_supabase()) {
        $config = goldhall_supabase_config();
        $key    = $config['key'] ?? '';

        $message = 'Supabase could not store the change.';
        if ($key !== '' && str_starts_with($key, 'sb_publishable_')) {
            $message .= ' GOLDHALL_SUPABASE_KEY holds the publishable key, which can only read;'
                . ' replace it with the secret key (sb_secret_…) or the legacy service_role key.';
        } else {
            $message .= ' Check GOLDHALL_SUPABASE_KEY and that the content_items table exists'
                . ' — see supabase-schema.sql.';
        }

        $detail = $detail !== '' ? $detail : goldhall_supabase_last_error();

        return $detail !== ''
            ? $message . ' Supabase said: ' . $detail
            : $message;
    }
    if (getenv('VERCEL') !== false || getenv('AWS_LAMBDA_FUNCTION_NAME') !== false) {
        return 'This deployment runs on a read-only filesystem, so the content file cannot be saved here. '
            . 'Connect Supabase to enable editing — see the README section "Hosting".';
    }
    return 'Could not write data/content.json. Check that the data directory is writable by PHP.';
}
