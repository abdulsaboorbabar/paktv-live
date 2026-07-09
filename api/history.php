<?php
// api/history.php
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

    $ids = array_filter(array_map('intval', explode(',', $idsRaw)));

    if (empty($ids)) {
        echo json_encode([
            'success' => true,
            'channels' => []
        ]);
        exit;
    }

    // Maintain watch history order if requested, or just return channels
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $sql = "SELECT * FROM channels WHERE id IN ($placeholders)";
    $stmt = $db->prepare($sql);
    $stmt->execute($ids);
    $channels = $stmt->fetchAll();

    // Map channels to stay in the input order
    $channelMap = [];
    foreach ($channels as $channel) {
        $channelMap[$channel['id']] = $channel;
    }

    $orderedChannels = [];
    foreach ($ids as $id) {
        if (isset($channelMap[$id])) {
            $orderedChannels[] = $channelMap[$id];
        }
    }

    echo json_encode([
        'success' => true,
        'channels' => $orderedChannels
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
