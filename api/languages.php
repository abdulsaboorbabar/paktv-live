<?php
// api/languages.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once __DIR__ . '/../php/db.php';

try {
    $stmt = $db->query("SELECT DISTINCT language FROM channels WHERE language IS NOT NULL AND language != '' ORDER BY language ASC");
    $languages = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'success' => true,
        'languages' => $languages
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
