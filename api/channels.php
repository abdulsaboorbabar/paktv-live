<?php
// api/channels.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once __DIR__ . '/../php/db.php';

try {
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $country = isset($_GET['country']) ? trim($_GET['country']) : '';
    $category = isset($_GET['category']) ? trim($_GET['category']) : '';
    $language = isset($_GET['language']) ? trim($_GET['language']) : '';
    $hd = isset($_GET['hd']) ? (int)$_GET['hd'] : -1;
    $onlineOnly = isset($_GET['online']) ? (int)$_GET['online'] : 0;
    
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    $conditions = [];
    $params = [];

    if ($search !== '') {
        // Multi-word search (e.g. "sports pakistan" finds Pakistani sports channels)
        $words = preg_split('/\s+/', $search);
        foreach ($words as $word) {
            $conditions[] = "(name LIKE ? OR country LIKE ? OR category LIKE ? OR language LIKE ?)";
            $params[] = "%$word%";
            $params[] = "%$word%";
            $params[] = "%$word%";
            $params[] = "%$word%";
        }
    }

    if ($country !== '' && strtolower($country) !== 'all countries') {
        $conditions[] = "country = ?";
        $params[] = $country;
    }

    if ($category !== '' && strtolower($category) !== 'all categories') {
        $conditions[] = "category = ?";
        $params[] = $category;
    }

    if ($language !== '' && strtolower($language) !== 'all languages') {
        $conditions[] = "language = ?";
        $params[] = $language;
    }

    if ($hd === 1) {
        $conditions[] = "is_hd = 1";
    }

    if ($onlineOnly === 1) {
        $conditions[] = "status = 'online'";
    }

    $whereClause = "";
    if (count($conditions) > 0) {
        $whereClause = "WHERE " . implode(" AND ", $conditions);
    }

    // Get total count for pagination headers / info
    $countSql = "SELECT COUNT(*) as total FROM channels $whereClause";
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($params);
    $totalCount = $countStmt->fetch()['total'];

    // Select query
    $sql = "SELECT * FROM channels $whereClause ORDER BY (CASE WHEN country = 'Pakistan' THEN 0 ELSE 1 END), name ASC LIMIT ? OFFSET ?";
    $stmt = $db->prepare($sql);
    
    // Bind limit & offset as integers
    $bindIdx = 1;
    foreach ($params as $param) {
        $stmt->bindValue($bindIdx++, $param);
    }
    $stmt->bindValue($bindIdx++, $limit, PDO::PARAM_INT);
    $stmt->bindValue($bindIdx++, $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $channels = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'total' => $totalCount,
        'limit' => $limit,
        'offset' => $offset,
        'channels' => $channels
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
