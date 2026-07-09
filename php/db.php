<?php
// php/db.php

$dbDir = __DIR__ . '/../data';
if (!is_dir($dbDir)) {
    mkdir($dbDir, 0777, true);
}

$dbPath = $dbDir . '/paktv.db';
try {
    $db = new PDO("sqlite:" . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // Create channels table
    $db->exec("CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        stream_url TEXT NOT NULL,
        country TEXT,
        category TEXT,
        language TEXT,
        logo_url TEXT,
        epg_id TEXT,
        website_url TEXT,
        resolution TEXT,
        is_hd INTEGER DEFAULT 0,
        status TEXT DEFAULT 'online',
        last_checked TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Indexing for faster query responses
    $db->exec("CREATE INDEX IF NOT EXISTS idx_channels_name ON channels(name)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_channels_country ON channels(country)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_channels_category ON channels(category)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_channels_language ON channels(language)");

} catch (PDOException $e) {
    die("Database Connection / Initialization Failed: " . $e->getMessage());
}
