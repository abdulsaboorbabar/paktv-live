<?php
// php/importer.php
require_once __DIR__ . '/db.php';

// Set execution time limit to 5 minutes as downloading multiple playlists can take time
set_time_limit(300);

function importPlaylists() {
    global $db;

    // Playlists to import by country
    $playlists = [
        'Pakistan'     => 'https://iptv-org.github.io/iptv/countries/pk.m3u',
        'India'        => 'https://iptv-org.github.io/iptv/countries/in.m3u',
        'Saudi Arabia' => 'https://iptv-org.github.io/iptv/countries/sa.m3u',
        'UAE'          => 'https://iptv-org.github.io/iptv/countries/ae.m3u',
        'United Kingdom'=> 'https://iptv-org.github.io/iptv/countries/uk.m3u',
        'USA'          => 'https://iptv-org.github.io/iptv/countries/us.m3u',
        'Turkey'       => 'https://iptv-org.github.io/iptv/countries/tr.m3u',
        'Qatar'        => 'https://iptv-org.github.io/iptv/countries/qa.m3u',
    ];

    $log = [];
    $totalImported = 0;

    // Prepare SQL queries
    $checkStmt = $db->prepare("SELECT id FROM channels WHERE stream_url = ?");
    $insertStmt = $db->prepare("INSERT INTO channels (name, stream_url, country, category, language, logo_url, epg_id, is_hd, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $updateStmt = $db->prepare("UPDATE channels SET name = ?, country = ?, category = ?, language = ?, logo_url = ?, epg_id = ?, is_hd = ?, status = ? WHERE stream_url = ?");

    foreach ($playlists as $country => $url) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_USERAGENT, 'PAKTV-Live-IPTV-Importer');
        $data = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || empty($data)) {
            $log[] = "Failed to fetch playlist for $country (HTTP $httpCode)";
            continue;
        }

        $lines = explode("\n", $data);
        $count = 0;

        for ($i = 0; $i < count($lines); $i++) {
            $line = trim($lines[$i]);
            if (strpos($line, '#EXTINF:') === 0) {
                // Parse metadata
                $name = '';
                $logo = '';
                $category = 'Entertainment'; // Default
                $epg_id = '';
                $language = 'Urdu'; // Default guess for PK, English/Hindi/etc. adjusted below

                // Extract tvg-logo
                if (preg_match('/tvg-logo="([^"]+)"/', $line, $matches)) {
                    $logo = $matches[1];
                }
                // Extract tvg-id (EPG)
                if (preg_match('/tvg-id="([^"]+)"/', $line, $matches)) {
                    $epg_id = $matches[1];
                }
                // Extract group-title (Category)
                if (preg_match('/group-title="([^"]+)"/', $line, $matches)) {
                    $category = trim($matches[1]);
                }

                // Get name (text after last comma)
                $commaPos = strrpos($line, ',');
                if ($commaPos !== false) {
                    $name = trim(substr($line, $commaPos + 1));
                }

                // Get stream URL on the next non-empty line
                $streamUrl = '';
                for ($j = $i + 1; $j < count($lines); $j++) {
                    $nextLine = trim($lines[$j]);
                    if (empty($nextLine)) continue;
                    if (strpos($nextLine, '#') === 0) {
                        // Another tag, stop looking for URL
                        break;
                    }
                    $streamUrl = $nextLine;
                    $i = $j; // advance outer loop index
                    break;
                }

                if (empty($name) || empty($streamUrl)) {
                    continue;
                }

                // Standardize default languages per country
                if ($country === 'Pakistan') $language = 'Urdu';
                elseif ($country === 'Saudi Arabia' || $country === 'UAE' || $country === 'Qatar') $language = 'Arabic';
                elseif ($country === 'United Kingdom' || $country === 'USA') $language = 'English';
                elseif ($country === 'India') $language = 'Hindi';
                elseif ($country === 'Turkey') $language = 'Turkish';

                // Categorization clean up
                $category = ucwords(strtolower($category));
                if (strpos(strtolower($name), 'news') !== false) $category = 'News';
                if (strpos(strtolower($name), 'sports') !== false || strpos(strtolower($name), 'sport') !== false) $category = 'Sports';
                if (strpos(strtolower($name), 'movie') !== false || strpos(strtolower($name), 'cine') !== false) $category = 'Movies';
                if (strpos(strtolower($name), 'music') !== false || strpos(strtolower($name), 'songs') !== false) $category = 'Music';
                if (strpos(strtolower($name), 'kids') !== false || strpos(strtolower($name), 'cartoon') !== false) $category = 'Kids';
                if (strpos(strtolower($name), 'islam') !== false || strpos(strtolower($name), 'quran') !== false || strpos(strtolower($name), 'religious') !== false) $category = 'Religious';

                // Check if HD
                $isHd = (strpos(strtolower($name), 'hd') !== false || strpos(strtolower($streamUrl), 'hd') !== false) ? 1 : 0;

                // Check if channel already exists
                $checkStmt->execute([$streamUrl]);
                $existing = $checkStmt->fetch();

                if ($existing) {
                    $updateStmt->execute([$name, $country, $category, $language, $logo, $epg_id, $isHd, 'online', $streamUrl]);
                } else {
                    $insertStmt->execute([$name, $streamUrl, $country, $category, $language, $logo, $epg_id, $isHd, 'online']);
                }
                $count++;
                $totalImported++;
            }
        }
        $log[] = "Imported $count channels for $country";
    }

    return [
        'success' => true,
        'imported_count' => $totalImported,
        'logs' => $log
    ];
}
