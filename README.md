# PAKTV Live - IPTV PWA Application

PAKTV Live is a lightweight, responsive, and framework-free IPTV Progressive Web Application (PWA) designed to stream publicly available TV channels from around the world using the `iptv-org` community databases, with a special curated focus on Pakistani television services.

## Features

- **Custom HLS.js Video Player**: Integrated control dashboard, buffering screens, reload buttons, screenshot capture, volume control, and playback speeds.
- **Search System**: Fast, debounced client-side matching across channel name, country, language, and category.
- **Dynamic Filters**: Multi-faceted selection matching (HD only, Country filters, Language filters, Category filtering, Favorites only).
- **Personalized Shelves**: Recently watched list and user favorites list saved persistently via browser LocalStorage.
- **Progressive Web App (PWA)**: Desktop/mobile installation support, custom web app manifests, service-worker caching, and an offline screen.
- **Admin Control Room**: Rebuild/import channel playlists from the source M3Us, delete dead data, and monitor stream count analytics.

---

## Folder Structure

```
/index.php              - Main user portal (channels grid & media player)
/manifest.json          - PWA Web App Manifest
/service-worker.js      - PWA Service Worker (offline cache engine)
/css/
  └── style.css         - Full custom style variables, responsive frames
/js/
  ├── app.js            - State manager, search debouncing, shelf triggers
  └── player.js         - HLS.js controller layer, shortcuts, re-connection
/php/
  ├── db.php            - SQLite tables and indices creation
  ├── importer.php      - IPTV-org M3U download parser
  └── generate_icons.php- GD icon-builder utility
/api/
  ├── channels.php      - Channels collection API
  ├── countries.php     - Unique country filter options API
  ├── categories.php    - Unique category filter options API
  ├── languages.php     - Unique language filter options API
  ├── favorites.php     - Batch favorites lookup API
  └── history.php       - Watch history tracker metadata API
/admin/
  └── index.php         - Administrator control console
/data/
  └── paktv.db          - Main SQLite database file
/assets/
  └── offline.html      - Fallback offline alert screen
/icons/
  ├── icon-192.png      - Android / PWA Icon (192x192)
  └── icon-512.png      - Android / PWA Icon (512x512)
```

---

## Database Schema (SQLite)

Table: `channels`
```sql
CREATE TABLE IF NOT EXISTS channels (
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
);
```

---

## Installation & Deployment

Copy all files to your PHP-enabled web server document root directory.

### Prerequisites
- PHP 8.0 or newer.
- SQLite extension enabled in your PHP installation (`php_sqlite3` / `pdo_sqlite`).
- cURL extension enabled for playlist sync.

### Apache Configuration (`.htaccess` / VirtualHost)

Ensure the web server has write access to the `/data/` folder to allow the SQLite database file to be created.

```apache
# Force HTTPS and configure CORS if needed
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Protect Database File
<Files "paktv.db">
    Order Allow,Deny
    Deny from all
</Files>
```

### Nginx Configuration

Add the following to your Nginx server block:

```nginx
server {
    listen 80;
    server_name paktv.local;
    root /var/www/paktv;
    index index.php index.html;

    # Secure SQLite database
    location ~* \.db$ {
        deny all;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Pass PHP scripts to FastCGI server
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

---

## EPG Support

The application extracts `tvg-id` automatically from playlists. EPG schedules can be loaded from standard XMLTV sources.

---

## PWA Setup
Ensure your server serves the application over **HTTPS** (or `localhost` during testing).
1. The service worker is registered automatically by `app.js`.
2. Chrome, Edge, and mobile browsers will display the installation button (plus sign in URL bar, or the header "Install" button) when the site metadata criteria are met.

---

## Vercel Deployment & Serverless Caveats

Vercel functions run in a serverless, read-only environment. This introduces two caveats for SQLite databases:
1. **Read-Only Filesystem**: You cannot write/sync new channels directly on Vercel (doing so will fail or reset when the serverless function restarts).
2. **Persistence**: The database file `paktv.db` must be populated locally first, and then committed to your Git repository.

### How to Deploy to Vercel:

1. **Populate the Database Locally**:
   - Run the app locally with `php -S localhost:8000`.
   - Go to `http://localhost:8000/admin/` and click **Start Sync Run**.
   - This creates and populates the database file inside `data/paktv.db`.

2. **Commit Database**:
   - Ensure `data/paktv.db` is tracked and committed to your Git repository (do not ignore it in `.gitignore`).

3. **Deploy**:
   - Push to GitHub/GitLab and link the repository to your Vercel Account.
   - Vercel will auto-detect the configuration in [vercel.json](file:///d:/bkup/paktv_live/vercel.json) and deploy the PHP serverless functions.
   - The application will query the committed, pre-populated SQLite database read-only on Vercel.
