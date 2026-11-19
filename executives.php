<?php
/** executives page. Content and layout live in includes/page-template.php. */
declare(strict_types=1);

/* Members only: a visitor without a Student Hub session is sent to the hub. */
require __DIR__ . '/includes/require-student.php';

$page_key = 'executives';
require __DIR__ . '/includes/page-template.php';
