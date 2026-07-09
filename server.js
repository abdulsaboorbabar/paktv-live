// server.js — PAKTV Live local development server
// Replaces PHP for local testing. Uses Node.js + better-sqlite3.

const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

// ─── Database Setup ──────────────────────────────────────────────────────────
const Database = require('better-sqlite3');
const dataDir  = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'paktv.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS channels (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    stream_url  TEXT NOT NULL,
    country     TEXT,
    category    TEXT,
    language    TEXT,
    logo_url    TEXT,
    epg_id      TEXT,
    website_url TEXT,
    resolution  TEXT,
    is_hd       INTEGER DEFAULT 0,
    status      TEXT DEFAULT 'online',
    last_checked TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_name     ON channels(name);
  CREATE INDEX IF NOT EXISTS idx_country  ON channels(country);
  CREATE INDEX IF NOT EXISTS idx_category ON channels(category);
  CREATE INDEX IF NOT EXISTS idx_language ON channels(language);
`);

// ─── Seed Sample Data (if DB is empty) ───────────────────────────────────────
const count = db.prepare('SELECT COUNT(*) as c FROM channels').get().c;
if (count === 0) {
  console.log('📺  Seeding sample channels...');
  const insert = db.prepare(`
    INSERT INTO channels (name, stream_url, country, category, language, logo_url, is_hd, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'online')
  `);
  const seed = db.transaction((channels) => {
    for (const ch of channels) insert.run(ch);
  });
  seed([
    // ── Pakistan ────────────────────────────────────────────────────────────
    ['Geo News',        'https://geo-sd.geo.tv/live/geo-news.m3u8',               'Pakistan','News','Urdu',  'https://i.imgur.com/7Xq7Jwl.png', 0],
    ['ARY News',        'https://arynews-live.geo.tv/live/ary-news.m3u8',          'Pakistan','News','Urdu',  'https://i.imgur.com/pJM0iLf.png', 0],
    ['Dunya News',      'https://dunyanews.tv/live/dunyanews.m3u8',                'Pakistan','News','Urdu',  'https://i.imgur.com/XNrGdWM.png', 0],
    ['Samaa TV',        'https://live.samaadigital.com/samaadigital.m3u8',         'Pakistan','News','Urdu',  'https://i.imgur.com/LBT8ELp.png', 0],
    ['Express News',    'https://live.express.pk/en/live.m3u8',                    'Pakistan','News','Urdu',  'https://i.imgur.com/4X7UxDH.png', 0],
    ['BOL News',        'https://boln.cdn.bol.com.pk/live/bolnews.m3u8',           'Pakistan','News','Urdu',  'https://i.imgur.com/ER0bXTM.png', 0],
    ['PTV Home',        'https://pvt-2.ptv.com.pk/live/ptv-home.m3u8',            'Pakistan','Entertainment','Urdu','https://i.imgur.com/yJvXXGO.png', 0],
    ['PTV News',        'https://pvt-2.ptv.com.pk/live/ptv-news.m3u8',            'Pakistan','News','Urdu',  'https://i.imgur.com/yJvXXGO.png', 0],
    ['PTV Sports',      'https://pvt-2.ptv.com.pk/live/ptv-sports.m3u8',          'Pakistan','Sports','Urdu','https://i.imgur.com/yJvXXGO.png', 0],
    ['Hum TV',          'https://humtv.cdn.bol.com.pk/live/humtv.m3u8',           'Pakistan','Entertainment','Urdu','https://i.imgur.com/3kAlhpd.png', 0],
    ['Hum Sitaray',     'https://humtv.cdn.bol.com.pk/live/humsitaray.m3u8',      'Pakistan','Entertainment','Urdu','https://i.imgur.com/3kAlhpd.png', 0],
    ['ARY Digital',     'https://arydigital.live.geo.tv/live/ary-digital.m3u8',   'Pakistan','Entertainment','Urdu','https://i.imgur.com/pJM0iLf.png', 0],
    ['TV One',          'https://tvone.cdn.bol.com.pk/live/tvone.m3u8',           'Pakistan','Entertainment','Urdu','https://i.imgur.com/k2Kg9jO.png', 0],
    ['A Plus',          'https://aplus.cdn.bol.com.pk/live/aplusentertainment.m3u8','Pakistan','Entertainment','Urdu','', 0],
    ['Geo Entertainment','https://geo-sd.geo.tv/live/geo-entertainment.m3u8',     'Pakistan','Entertainment','Urdu','https://i.imgur.com/7Xq7Jwl.png', 0],
    ['GEO Super',       'https://geo-sd.geo.tv/live/geo-super.m3u8',              'Pakistan','Sports','Urdu', 'https://i.imgur.com/7Xq7Jwl.png', 0],
    ['Ten Sports',      'https://tensports.cdn.bol.com.pk/live/tensports.m3u8',   'Pakistan','Sports','Urdu', '', 0],
    ['Aaj TV',          'https://aajnews.cdn.bol.com.pk/live/aajnews.m3u8',       'Pakistan','News','Urdu',  '', 0],
    ['Capital TV',      'https://capitaltv.cdn.bol.com.pk/live/capitaltv.m3u8',   'Pakistan','News','Urdu',  '', 0],
    ['Roze TV',         'https://rozens.cdn.bol.com.pk/live/roze.m3u8',           'Pakistan','News','Urdu',  '', 0],
    ['KTN Sindhi',      'https://ktn.cdn.bol.com.pk/live/ktn.m3u8',              'Pakistan','Entertainment','Sindhi','', 0],
    ['Kashish TV',      'https://kashish.cdn.bol.com.pk/live/kashish.m3u8',       'Pakistan','Entertainment','Sindhi','', 0],
    ['Khyber TV',       'https://khyber.cdn.bol.com.pk/live/khyber.m3u8',        'Pakistan','Entertainment','Pashto','', 0],
    ['AVT Khyber',      'https://avt.cdn.bol.com.pk/live/avt.m3u8',              'Pakistan','Entertainment','Pashto','', 0],
    ['Naya Pakistan',   'https://np.cdn.bol.com.pk/live/nayapakistan.m3u8',       'Pakistan','News','Urdu',  '', 0],
    ['Quran TV',        'https://qurantv.cdn.bol.com.pk/live/qurantv.m3u8',       'Pakistan','Religious','Urdu','', 0],
    ['Peace TV Urdu',   'https://peacetv.cdn.bol.com.pk/live/peaceurdu.m3u8',     'Pakistan','Religious','Urdu','', 0],
    ['QTV',             'https://qtv.cdn.bol.com.pk/live/qtv.m3u8',              'Pakistan','Religious','Urdu','', 0],
    // ── India ───────────────────────────────────────────────────────────────
    ['Aaj Tak',         'https://hls.aajtaklive.in/aajtak/hls/live.m3u8',         'India','News','Hindi',  'https://i.imgur.com/sjE3tur.png', 1],
    ['India TV',        'https://indiatvnews-lh.akamaized.net/i/INDIATV_1@492683/index_1200_av-p.m3u8','India','News','Hindi','', 0],
    ['Zee News',        'https://zee24tasnews.akamaized.net/hls/live/576042/zees/stream01/index.m3u8', 'India','News','Hindi','', 0],
    // ── Saudi Arabia ────────────────────────────────────────────────────────
    ['Saudi TV1',       'https://Sauditv1live.akamaized.net/hls/live/572487/Sauditv1live/playlist.m3u8','Saudi Arabia','Entertainment','Arabic','', 0],
    ['Al Arabiya',      'https://alarabiyamobile.akamaized.net/hls/live/2003693/alarabiyamobile/index.m3u8','Saudi Arabia','News','Arabic','', 0],
    // ── UAE ─────────────────────────────────────────────────────────────────
    ['Al Jazeera Arabic','https://live-hls-web-aja.getaj.net/AJA/index.m3u8',     'Qatar','News','Arabic','https://i.imgur.com/0tBXp0r.png', 1],
    ['Al Jazeera English','https://live-hls-web-aje.getaj.net/AJE/index.m3u8',    'Qatar','News','English','https://i.imgur.com/0tBXp0r.png', 1],
    // ── UK ──────────────────────────────────────────────────────────────────
    ['Sky News',        'https://skynews-hand-skynewsapple-t.akamaized.net/hls/live/561321/skynewsapple/skynews/skynews/master.m3u8','United Kingdom','News','English','', 1],
    // ── Turkey ──────────────────────────────────────────────────────────────
    ['TRT World',       'https://trtworldlive.cdn.bol.com.pk/live/trtworld.m3u8', 'Turkey','News','English','', 1],
    ['TRT Haber',       'https://tv-trt1.medya.trt.com.tr/master.m3u8',           'Turkey','News','Turkish','', 0],
  ]);
  console.log(`✅  Seeded ${db.prepare('SELECT COUNT(*) as c FROM channels').get().c} channels.`);
}

// ─── MIME Types ──────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
};

// ─── JSON helper ─────────────────────────────────────────────────────────────
function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

// ─── API Handlers ─────────────────────────────────────────────────────────────
function handleAPI(pathname, query, res) {
  // GET /api/channels
  if (pathname === '/api/channels' || pathname === '/api/channels.php') {
    const search    = (query.search || '').trim();
    const country   = (query.country || '').trim();
    const category  = (query.category || '').trim();
    const language  = (query.language || '').trim();
    const hd        = parseInt(query.hd) === 1;
    const limit     = Math.min(parseInt(query.limit)  || 50, 200);
    const offset    = parseInt(query.offset) || 0;

    let sql    = 'SELECT * FROM channels WHERE 1=1';
    let params = [];

    if (search) {
      const words = search.split(/\s+/);
      for (const w of words) {
        sql += ' AND (name LIKE ? OR country LIKE ? OR category LIKE ? OR language LIKE ?)';
        params.push(`%${w}%`, `%${w}%`, `%${w}%`, `%${w}%`);
      }
    }
    if (country)  { sql += ' AND country = ?';  params.push(country); }
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (language) { sql += ' AND language = ?'; params.push(language); }
    if (hd)       { sql += ' AND is_hd = 1'; }

    const total    = db.prepare(`SELECT COUNT(*) as c FROM channels WHERE 1=1${sql.slice(sql.indexOf(' AND'))}`).get(...params).c;
    const channels = db.prepare(`${sql} ORDER BY (CASE WHEN country='Pakistan' THEN 0 ELSE 1 END), name ASC LIMIT ? OFFSET ?`).all(...params, limit, offset);
    return json(res, { success: true, total, limit, offset, channels });
  }

  // GET /api/countries
  if (pathname === '/api/countries' || pathname === '/api/countries.php') {
    const rows = db.prepare("SELECT DISTINCT country FROM channels WHERE country IS NOT NULL AND country != '' ORDER BY country ASC").all();
    return json(res, { success: true, countries: rows.map(r => r.country) });
  }

  // GET /api/categories
  if (pathname === '/api/categories' || pathname === '/api/categories.php') {
    const rows = db.prepare("SELECT DISTINCT category FROM channels WHERE category IS NOT NULL AND category != '' ORDER BY category ASC").all();
    return json(res, { success: true, categories: rows.map(r => r.category) });
  }

  // GET /api/languages
  if (pathname === '/api/languages' || pathname === '/api/languages.php') {
    const rows = db.prepare("SELECT DISTINCT language FROM channels WHERE language IS NOT NULL AND language != '' ORDER BY language ASC").all();
    return json(res, { success: true, languages: rows.map(r => r.language) });
  }

  // GET /api/favorites?ids=1,2,3
  if (pathname === '/api/favorites' || pathname === '/api/favorites.php') {
    const ids = (query.ids || '').split(',').map(Number).filter(Boolean);
    if (!ids.length) return json(res, { success: true, channels: [] });
    const placeholders = ids.map(() => '?').join(',');
    const channels = db.prepare(`SELECT * FROM channels WHERE id IN (${placeholders}) ORDER BY name ASC`).all(...ids);
    return json(res, { success: true, channels });
  }

  // GET /api/history?ids=1,2,3
  if (pathname === '/api/history' || pathname === '/api/history.php') {
    const ids = (query.ids || '').split(',').map(Number).filter(Boolean);
    if (!ids.length) return json(res, { success: true, channels: [] });
    const placeholders = ids.map(() => '?').join(',');
    const rows = db.prepare(`SELECT * FROM channels WHERE id IN (${placeholders})`).all(...ids);
    const map  = Object.fromEntries(rows.map(r => [r.id, r]));
    return json(res, { success: true, channels: ids.map(id => map[id]).filter(Boolean) });
  }

  return json(res, { success: false, error: 'Unknown API endpoint' }, 404);
}

// ─── Static File Server ───────────────────────────────────────────────────────
function serveStatic(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext  = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

// ─── HTTP Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;

const server = http.createServer((req, res) => {
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname.replace(/\/$/, '') || '/';
  const query    = parsed.query;

  // API routes
  if (pathname.startsWith('/api/')) {
    return handleAPI(pathname, query, res);
  }

  // Admin route → serve api/admin/index.html (static re-skin)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const adminFile = path.join(__dirname, 'api', 'admin', 'index.html');
    // Fall back to a simple redirect message if not compiled
    return fs.existsSync(adminFile)
      ? serveStatic(adminFile, res)
      : serveMain(res);
  }

  // Root / index — serve api/index.php as HTML (no PHP tags, pure HTML)
  if (pathname === '/' || pathname === '/index.php' || pathname === '/index.html') {
    return serveStatic(path.join(__dirname, 'api', 'index.php'), res);
  }

  // service-worker.js, manifest.json from root
  const rootFiles = ['/service-worker.js', '/manifest.json'];
  if (rootFiles.includes(pathname)) {
    return serveStatic(path.join(__dirname, pathname.slice(1)), res);
  }

  // Everything else: serve from project root
  const filePath = path.join(__dirname, pathname.slice(1));
  return serveStatic(filePath, res);
});

function serveMain(res) {
  serveStatic(path.join(__dirname, 'api', 'index.php'), res);
}

server.listen(PORT, () => {
  console.log('');
  console.log('  ██████╗  █████╗ ██╗  ██╗████████╗██╗   ██╗');
  console.log('  ██╔══██╗██╔══██╗██║ ██╔╝╚══██╔══╝██║   ██║');
  console.log('  ██████╔╝███████║█████╔╝    ██║   ██║   ██║');
  console.log('  ██╔═══╝ ██╔══██║██╔═██╗    ██║   ╚██╗ ██╔╝');
  console.log('  ██║     ██║  ██║██║  ██╗   ██║    ╚████╔╝ ');
  console.log('  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═╝     ╚═══╝  ');
  console.log('');
  console.log(`  🚀  Server running at: http://localhost:${PORT}`);
  console.log(`  📺  Open in browser:   http://localhost:${PORT}`);
  console.log(`  ⚙️   Admin panel:       http://localhost:${PORT}/admin`);
  console.log('');
});
