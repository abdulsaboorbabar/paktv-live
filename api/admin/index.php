<?php
// api/admin/index.php
// Paths go up 3 levels: api/admin/ -> api/ -> project root -> php/
require_once __DIR__ . '/../../php/db.php';

$message = '';
$logs = [];

if (isset($_POST['action'])) {
    $action = $_POST['action'];
    if ($action === 'sync') {
        require_once __DIR__ . '/../../php/importer.php';
        $result = importPlaylists();
        if ($result['success']) {
            $message = "Sync completed! Imported/Updated " . $result['imported_count'] . " channels.";
            $logs = $result['logs'];
        } else {
            $message = "Sync failed!";
        }
    } elseif ($action === 'clear_db') {
        try {
            $db->exec("DELETE FROM channels");
            $db->exec("VACUUM");
            $message = "Database cleared and optimized.";
        } catch (Exception $e) {
            $message = "Failed to clear database: " . $e->getMessage();
        }
    }
}

$totalChannels = 0;
$hdCount = 0;
$countries = [];
$categories = [];

try {
    $totalChannels = $db->query("SELECT COUNT(*) FROM channels")->fetchColumn();
    $hdCount       = $db->query("SELECT COUNT(*) FROM channels WHERE is_hd = 1")->fetchColumn();
    $countries     = $db->query("SELECT country, COUNT(*) as count FROM channels GROUP BY country ORDER BY count DESC")->fetchAll();
    $categories    = $db->query("SELECT category, COUNT(*) as count FROM channels GROUP BY category ORDER BY count DESC")->fetchAll();
} catch (Exception $e) {
    $message = "Error fetching stats: " . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PAKTV Live - Admin Console</title>
    <style>
        body { background:#0d0e12; color:#f3f4f6; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; margin:0; padding:2rem; }
        .container { max-width:900px; margin:0 auto; }
        header { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:1rem; margin-bottom:2rem; }
        h1 { margin:0; background:linear-gradient(135deg,#14b8a6,#2dd4bf); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .btn-portal { color:#14b8a6; text-decoration:none; font-weight:600; }
        .alert { background:rgba(20,184,166,0.1); border:1px solid #14b8a6; padding:1rem; border-radius:8px; margin-bottom:1.5rem; color:#2dd4bf; }
        .grid { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:2rem; }
        @media(max-width:768px){ .grid{ grid-template-columns:1fr; } }
        .card { background:#14161f; border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:1.5rem; }
        .card h2 { margin-top:0; font-size:1.2rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:.5rem; }
        .stat-val { font-size:2.5rem; font-weight:800; color:#14b8a6; margin:1rem 0; }
        .btn { background:#0f766e; color:#fff; border:none; padding:.75rem 1.5rem; border-radius:6px; font-weight:600; cursor:pointer; transition:background .2s; }
        .btn:hover { background:#0d9488; }
        .btn-danger { background:#b91c1c; }
        .btn-danger:hover { background:#991b1b; }
        ul { list-style:none; padding:0; margin:0; }
        li { display:flex; justify-content:space-between; padding:.5rem 0; border-bottom:1px solid rgba(255,255,255,0.02); font-size:.9rem; }
        li:last-child { border:none; }
        .logs-box { background:#000; padding:1rem; border-radius:8px; font-family:monospace; max-height:200px; overflow-y:auto; margin-top:1rem; border:1px solid rgba(255,255,255,0.05); }
        .logs-box p { margin:.25rem 0; font-size:.85rem; }
    </style>
</head>
<body>
<div class="container">
    <header>
        <div>
            <h1>PAKTV Live</h1>
            <small style="color:#9ca3af">Administration Panel</small>
        </div>
        <a href="/" class="btn-portal">&larr; Back to Portal</a>
    </header>

    <?php if (!empty($message)): ?>
        <div class="alert"><?php echo htmlspecialchars($message); ?></div>
    <?php endif; ?>

    <?php if (!empty($logs)): ?>
        <div class="card" style="margin-bottom:1.5rem;">
            <h2>Sync Log Output</h2>
            <div class="logs-box">
                <?php foreach ($logs as $log): ?>
                    <p style="color:#4ade80">&gt; <?php echo htmlspecialchars($log); ?></p>
                <?php endforeach; ?>
            </div>
        </div>
    <?php endif; ?>

    <div class="grid">
        <div class="card">
            <h2>IPTV Sync Manager</h2>
            <p>Fetch latest public live IPTV playlists from iptv-org repositories.</p>
            <form method="POST" style="margin-top:1.5rem;">
                <input type="hidden" name="action" value="sync">
                <button type="submit" class="btn">Start Sync Run</button>
            </form>
        </div>
        <div class="card">
            <h2>System Stats</h2>
            <div style="display:flex; justify-content:space-around;">
                <div><div class="stat-val"><?php echo $totalChannels; ?></div><small>Total Channels</small></div>
                <div><div class="stat-val"><?php echo $hdCount; ?></div><small>HD Streams</small></div>
            </div>
            <form method="POST" onsubmit="return confirm('Delete all channels?');" style="margin-top:1.5rem; text-align:right;">
                <input type="hidden" name="action" value="clear_db">
                <button type="submit" class="btn btn-danger">Flush Database</button>
            </form>
        </div>
    </div>

    <div class="grid">
        <div class="card">
            <h2>Channels by Country</h2>
            <ul>
                <?php foreach ($countries as $c): ?>
                    <li>
                        <span><?php echo htmlspecialchars($c['country']); ?></span>
                        <span style="font-weight:700; color:#14b8a6;"><?php echo $c['count']; ?></span>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
        <div class="card">
            <h2>Channels by Category</h2>
            <ul>
                <?php foreach ($categories as $cat): ?>
                    <li>
                        <span><?php echo htmlspecialchars($cat['category']); ?></span>
                        <span style="font-weight:700; color:#2dd4bf;"><?php echo $cat['count']; ?></span>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </div>
</div>
</body>
</html>
