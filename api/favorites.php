<?php
// api/favorites.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once __DIR__ . '/../php/db.php';

try {
    $idsRaw = isset($_GET['ids']) ? trim($_GET['ids']) : '';
    if (empty($idsRaw)) {
        echo json_encode([
            'success' => true,
            'channels' => []
        ]);
        exit;
    }

    // Sanitize and split IDs
    $ids = array_filter(array_map('intval', explode(',', $idsRaw)));

    if (empty($ids)) {
        echo json_encode([
            'success' => true,
            'channels' => []
        ]);
        exit;
    }

    // Prepare placeholders: ?,?,?
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $sql = "SELECT * FROM channels WHERE id IN ($placeholders) ORDER BY name ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute($ids);
    $channels = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'channels' => $channels
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
