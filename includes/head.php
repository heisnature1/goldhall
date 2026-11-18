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
</head>
<body class="<?= goldhall_e($body_class) ?>"<?= $body_data !== '' ? ' ' . $body_data : '' ?>>
