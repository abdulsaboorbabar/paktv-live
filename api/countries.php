<?php
// api/countries.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once __DIR__ . '/../php/db.php';

try {
    $stmt = $db->query("SELECT DISTINCT country FROM channels WHERE country IS NOT NULL AND country != '' ORDER BY country ASC");
    $countries = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'success' => true,
        'countries' => $countries
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
