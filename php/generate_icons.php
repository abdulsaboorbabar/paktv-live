<?php
// php/generate_icons.php

$iconsDir = __DIR__ . '/../icons';
if (!is_dir($iconsDir)) {
    mkdir($iconsDir, 0777, true);
}

function generateIcon($size, $outputPath) {
    if (!extension_loaded('gd')) {
        echo "GD extension is not loaded. Cannot generate PNG icon dynamically.\n";
        return false;
    }

    $im = imagecreatetruecolor($size, $size);
    
    // Antialiasing & Alpha support
    imagealphablending($im, false);
    imagesavealpha($im, true);

    // Colors
    $darkBlue = imagecolorallocate($im, 13, 14, 18);
    $teal = imagecolorallocate($im, 15, 118, 110);
    $white = imagecolorallocate($im, 255, 255, 255);
    $lightTeal = imagecolorallocate($im, 20, 184, 166);

    // Fill background (rounded rect effect or full)
    imagefilledrectangle($im, 0, 0, $size, $size, $darkBlue);

    // Draw circular/rounded backdrop for teal
    $radius = (int)($size * 0.45);
    $center = (int)($size / 2);
    
    // Draw outer glow circle
    for ($r = $radius; $r > 0; $r--) {
        $factor = $r / $radius;
        $redVal = 13 + (15 - 13) * $factor;
        $greenVal = 14 + (118 - 14) * $factor;
        $blueVal = 18 + (110 - 18) * $factor;
        $col = imagecolorallocate($im, (int)$redVal, (int)$greenVal, (int)$blueVal);
        imagefilledellipse($im, $center, $center, $r * 2, $r * 2, $col);
    }

    // Draw a stylized play button / TV frame
    $margin = (int)($size * 0.3);
    $right = $size - $margin;
    $bottom = $size - $margin;

    // Draw TV Box outline
    $points = [
        (int)($size * 0.28), (int)($size * 0.35),
        (int)($size * 0.72), (int)($size * 0.35),
        (int)($size * 0.72), (int)($size * 0.65),
        (int)($size * 0.28), (int)($size * 0.65)
    ];
    
    // We can draw a Play Triangle inside the TV frame
    $p1_x = (int)($size * 0.43);
    $p1_y = (int)($size * 0.42);
    $p2_x = (int)($size * 0.43);
    $p2_y = (int)($size * 0.58);
    $p3_x = (int)($size * 0.60);
    $p3_y = (int)($size * 0.50);

    $playPoints = [$p1_x, $p1_y, $p2_x, $p2_y, $p3_x, $p3_y];
    imagefilledpolygon($im, $playPoints, 3, $white);

    // Save image
    imagepng($im, $outputPath);
    imagedestroy($im);
    echo "Generated $outputPath ({$size}x{$size})\n";
    return true;
}

generateIcon(192, $iconsDir . '/icon-192.png');
generateIcon(512, $iconsDir . '/icon-512.png');
