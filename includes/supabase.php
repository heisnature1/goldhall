<?php
/**
 * Minimal Supabase client for the Gold Hall content layer.
 *
 * The site talks to Supabase over its REST API with plain HTTP, so there is no
 * Composer dependency and nothing to install on the server.
 *
 * Configuration comes from environment variables (see .env.example):
 *
 *   GOLDHALL_SUPABASE_URL          https://<project-ref>.supabase.co
 *   GOLDHALL_SUPABASE_KEY          the service_role key  (server-side only)
 *   GOLDHALL_SUPABASE_BUCKET       optional, defaults to "uploads"
 *
 * SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are accepted as fallbacks.
 *
 * The service_role key bypasses Row Level Security, which is what lets the
 * admin portal write. It must never reach the browser: everything here runs
 * server-side, and public pages are rendered by PHP.
 */

declare(strict_types=1);

/**
 * Supabase settings, or null when it has not been configured.
 *
 * @return array{url:string,key:string,bucket:string}|null
 */
function goldhall_supabase_config(): ?array
{
    static $config = null;
    static $resolved = false;

    if ($resolved) {
        return $config;
    }
    $resolved = true;

    $url = getenv('GOLDHALL_SUPABASE_URL') ?: getenv('SUPABASE_URL');
    $key = getenv('GOLDHALL_SUPABASE_KEY') ?: getenv('SUPABASE_SERVICE_ROLE_KEY');
    $bucket = getenv('GOLDHALL_SUPABASE_BUCKET') ?: 'uploads';

    $url = is_string($url) ? trim($url) : '';
    $key = is_string($key) ? trim($key) : '';

    if ($url === '' || $key === '') {
        $config = null;
        return null;
    }

    // Tolerate a trailing slash on the project URL.
    $config = [
        'url'    => rtrim($url, '/'),
        'key'    => $key,
        'bucket' => is_string($bucket) && $bucket !== '' ? $bucket : 'uploads',
    ];

    return $config;
}

/** True when the site is backed by Supabase rather than the JSON file. */
function goldhall_uses_supabase(): bool
{
    return goldhall_supabase_config() !== null;
}

/**
 * Perform an HTTP request and return a normalised result.
 *
 * Uses the cURL extension when it is available and falls back to PHP streams,
 * so it works on shared hosting and on serverless runtimes alike.
 *
 * @param  array<string,string>      $headers
 * @param  array<string,mixed>|null  $json
 * @return array{ok:bool,status:int,body:string,json:mixed,error:string}
 */
function goldhall_http(string $method, string $url, array $headers = [], ?array $json = null, ?string $rawBody = null): array
{
    $result = ['ok' => false, 'status' => 0, 'body' => '', 'json' => null, 'error' => ''];

    $payload = $rawBody;
    $headers = array_map('strval', $headers);

    if ($json !== null) {
        $encoded = json_encode($json, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($encoded === false) {
            $result['error'] = 'Could not encode the request body.';
            return $result;
        }
        $payload = $encoded;
        $headers[] = 'Content-Type: application/json';
    }

    if (function_exists('curl_init')) {
        $handle = curl_init($url);
        curl_setopt_array($handle, [
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 20,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);
        if ($payload !== null) {
            curl_setopt($handle, CURLOPT_POSTFIELDS, $payload);
        }
        $body   = curl_exec($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_HTTP_CODE);
        $error  = curl_error($handle);
        curl_close($handle);
    } else {
        $http = [
            'method'        => $method,
            'header'        => implode("\r\n", $headers),
            'timeout'       => 20,
            'ignore_errors' => true,
        ];
        if ($payload !== null) {
            $http['content'] = $payload;
        }
        $context = stream_context_create(['http' => $http]);
        $body    = @file_get_contents($url, false, $context);
        $error   = $body === false ? 'The request failed.' : '';
        $status  = 0;
        if (!empty($http_response_header)) {
            foreach ($http_response_header as $line) {
                if (preg_match('#^HTTP/\S+\s+(\d{3})#', $line, $match)) {
                    $status = (int) $match[1];
                }
            }
        }
    }

    if ($body === false) {
        $result['error'] = $error !== '' ? $error : 'The request failed.';
        return $result;
    }

    $result['status'] = $status;
    $result['body']   = (string) $body;
    $result['ok']     = $status >= 200 && $status < 300;

    if ($result['body'] !== '') {
        $decoded = json_decode($result['body'], true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $result['json'] = $decoded;
        }
    }

    if (!$result['ok']) {
        $message = '';
        if (is_array($result['json'])) {
            $message = (string) ($result['json']['message'] ?? $result['json']['error'] ?? '');
        }
        $result['error'] = $message !== ''
            ? $message
            : ('Supabase returned HTTP ' . $status . '.');
    }

    return $result;
}

/**
 * The last Supabase error, so the admin portal can say what actually failed.
 *
 * The message never contains the key: goldhall_http() only reports the HTTP
 * status or the server's own message field.
 */
function goldhall_supabase_last_error(?string $message = null): string
{
    static $last = '';

    if ($message !== null) {
        $last = $message;
    }

    return $last;
}

/**
 * Auth headers for Supabase.
 *
 * Two key formats are in circulation:
 *
 *   eyJ...            the legacy anon / service_role JWT
 *   sb_secret_...     the newer secret key
 *
 * Both go in `apikey`, but only a JWT is a bearer token. Sending a
 * `sb_secret_` key as `Authorization: Bearer` makes Supabase reject the
 * request ("Forbidden use of secret API key in browser"), so the header is
 * only added when the key really is a JWT. Both keys stay server-side.
 *
 * @return list<string>
 */
function goldhall_supabase_headers(string $key, string $accept = 'application/json'): array
{
    $headers = ['apikey: ' . $key, 'Accept: ' . $accept];

    if (str_starts_with($key, 'eyJ')) {
        $headers[] = 'Authorization: Bearer ' . $key;
    }

    return $headers;
}

/**
 * Call the Supabase REST API.
 *
 * @param  array<string,string>      $query
 * @param  array<string,mixed>|null  $json
 * @param  array<string,string>      $extraHeaders
 * @return array{ok:bool,status:int,body:string,json:mixed,error:string}
 */
function goldhall_supabase(
    string $method,
    string $path,
    array $query = [],
    ?array $json = null,
    array $extraHeaders = []
): array {
    $config = goldhall_supabase_config();
    if ($config === null) {
        return ['ok' => false, 'status' => 0, 'body' => '', 'json' => null, 'error' => 'Supabase is not configured.'];
    }

    $url = $config['url'] . $path;
    if ($query) {
        $url .= (str_contains($url, '?') ? '&' : '?') . http_build_query($query);
    }

    $headers = array_merge(goldhall_supabase_headers($config['key'], 'application/json'), $extraHeaders);

    $response = goldhall_http($method, $url, $headers, $json);

    if (!$response['ok']) {
        goldhall_supabase_last_error($response['error']);
    }

    return $response;
}

/**
 * Upload a base64 data URL to Supabase Storage and return its public URL.
 *
 * The admin picture field processes the file in the browser and sends a data
 * URL; storing that verbatim would put hundreds of kilobytes into every row.
 *
 * @return array{url:string,error:string}
 */
function goldhall_supabase_upload_data_url(string $dataUrl): array
{
    if (!preg_match('#^data:image/([a-z0-9.+-]+);base64,(.+)$#is', trim($dataUrl), $match)) {
        return ['url' => '', 'error' => 'Not a base64 image.'];
    }

    $binary = base64_decode($match[2], true);
    if ($binary === false || $binary === '') {
        return ['url' => '', 'error' => 'Could not decode the picture.'];
    }

    $tmp = tempnam(sys_get_temp_dir(), 'goldhall');
    if ($tmp === false || @file_put_contents($tmp, $binary) === false) {
        return ['url' => '', 'error' => 'Could not stage the picture.'];
    }

    $extension = strtolower($match[1]);
    $extension = $extension === 'jpeg' ? 'jpg' : preg_replace('/[^a-z0-9]/', '', $extension);

    $stored = goldhall_supabase_upload($tmp, $extension);
    @unlink($tmp);

    return $stored;
}

/** Upload a picture to Supabase Storage and return its public URL.
 *
 * Objects are stored under `content/<date>-<random>.<ext>`; the bucket must be
 * public for the public pages to render the picture.
 *
 * @return array{url:string,error:string}
 */
function goldhall_supabase_upload(string $filePath, string $extension): array
{
    $config = goldhall_supabase_config();
    if ($config === null) {
        return ['url' => '', 'error' => 'Supabase is not configured.'];
    }

    $contents = @file_get_contents($filePath);
    if ($contents === false) {
        return ['url' => '', 'error' => 'Could not read the uploaded file.'];
    }

    $extension = strtolower(preg_replace('/[^a-z0-9]/i', '', $extension) ?: 'jpg');
    $name = 'content/' . date('Ymd-His') . '-' . bin2hex(random_bytes(5)) . '.' . $extension;

    $result = goldhall_http(
        'POST',
        $config['url'] . '/storage/v1/object/' . rawurlencode($config['bucket']) . '/' . $name,
        array_merge(
            goldhall_supabase_headers($config['key'], 'application/json'),
            [
                'Content-Type: ' . (function_exists('mime_content_type') ? (mime_content_type($filePath) ?: 'application/octet-stream') : 'application/octet-stream'),
                'x-upsert: true',
            ]
        ),
        null,
        $contents
    );

    if (!$result['ok']) {
        return ['url' => '', 'error' => $result['error'] !== '' ? $result['error'] : 'Storage upload failed.'];
    }

    return [
        'url'   => $config['url'] . '/storage/v1/object/public/' . rawurlencode($config['bucket']) . '/' . $name,
        'error' => '',
    ];
}

/**
 * A health check for the admin portal's status line.
 *
 * Reads a page of rows so the number shown is real, and reports which kind of
 * key is configured — a publishable key can read but not write, which is the
 * one misconfiguration worth naming out loud.
 *
 * @return array{configured:bool,ok:bool,rows:int|null,key_kind:string,message:string}
 */
function goldhall_supabase_status(): array
{
    $config = goldhall_supabase_config();
    if ($config === null) {
        return [
            'configured' => false,
            'ok'         => false,
            'rows'       => null,
            'key_kind'   => '',
            'message'    => 'Supabase is not configured, so content is served from the seed file and '
                . 'changes cannot be saved on this host.',
        ];
    }

    $key      = $config['key'];
    $keyKind  = str_starts_with($key, 'sb_publishable_')
        ? 'publishable'
        : (str_starts_with($key, 'sb_secret_') ? 'secret' : (str_starts_with($key, 'eyJ') ? 'service_role' : 'unknown'));

    $response = goldhall_supabase('GET', '/rest/v1/content_items', ['select' => 'id', 'limit' => '1000']);

    if (!$response['ok'] || !is_array($response['json'])) {
        return [
            'configured' => true,
            'ok'         => false,
            'rows'       => null,
            'key_kind'   => $keyKind,
            'message'    => 'Supabase is configured but the content table could not be read: '
                . ($response['error'] !== '' ? $response['error'] : 'unknown error')
                . ' Run supabase-schema.sql if the table does not exist yet.',
        ];
    }

    $rows = count($response['json']);

    if ($keyKind === 'publishable') {
        return [
            'configured' => true,
            'ok'         => false,
            'rows'       => $rows,
            'key_kind'   => $keyKind,
            'message'    => 'Read-only key: GOLDHALL_SUPABASE_KEY holds the publishable key, so pages read from '
                . 'Supabase but the portal cannot save. Replace it with the secret key or the legacy service_role key.',
        ];
    }

    return [
        'configured' => true,
        'ok'         => true,
        'rows'       => $rows,
        'key_kind'   => $keyKind,
        'message'    => $rows === 0
            ? 'Connected to Supabase. The table is empty, so the seed content will be imported on the next page load.'
            : 'Connected to Supabase — ' . $rows . ' content item' . ($rows === 1 ? '' : 's') . ' stored.',
    ];
}
