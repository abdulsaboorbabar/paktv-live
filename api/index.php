<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PAKTV Live - Watch Public TV Channels Anywhere</title>
    <meta name="description" content="Watch high-quality, publicly available live IPTV channels with special focus on Pakistani news, entertainment, and sports.">
    <link rel="manifest" href="/manifest.json">
    <link rel="stylesheet" href="/css/style.css">
    <link rel="icon" type="image/png" href="/icons/icon-192.png">
    <meta name="theme-color" content="#0f766e">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="PAKTV">
    <link rel="apple-touch-icon" href="/icons/icon-192.png">
</head>
<body>

    <!-- App Header -->
    <header>
        <div class="logo-area">
            <h1>PAKTV</h1>
            <span>Live</span>
        </div>

        <div class="search-box">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="search-input" placeholder="Search channel, category, country...">
        </div>

        <div class="header-controls">
            <button id="refresh-btn" class="btn-icon" title="Refresh Database">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            </button>
            <button id="install-btn" class="btn-icon" title="Install App" style="display: none;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </button>
            <div id="online-status" class="online-indicator">
                <div class="online-dot"></div>
                <span>Online</span>
            </div>
        </div>
    </header>

    <div class="app-container">
        <!-- Sidebar with filters and channel listings -->
        <aside class="sidebar">
            <div class="filters-panel">
                <div class="filter-row">
                    <select id="country-select" class="filter-select">
                        <option value="">All Countries</option>
                    </select>
                    <select id="category-select" class="filter-select">
                        <option value="">All Categories</option>
                    </select>
                </div>
                <div class="filter-row">
                    <select id="language-select" class="filter-select">
                        <option value="">All Languages</option>
                    </select>
                </div>
                <div class="checkbox-filters">
                    <label>
                        <input type="checkbox" id="hd-checkbox">
                        <span>HD Only</span>
                    </label>
                    <label>
                        <input type="checkbox" id="favorites-checkbox">
                        <span>Favorites Only</span>
                    </label>
                </div>
            </div>

            <div class="channels-list-wrapper">
                <div class="section-title">
                    <span>Live Channels</span>
                </div>
                <div id="channels-grid" class="channels-grid">
                    <!-- Channels load dynamically -->
                </div>
            </div>
        </aside>

        <!-- Player & Shelf Section -->
        <main class="player-area">
            <div class="player-frame-container">
                <!-- Custom HLS Video Player Screen -->
                <div id="player-container" class="pak-player-container paused">
                    <video id="main-video" playsinline></video>

                    <!-- Buffer Loading Overlay -->
                    <div class="player-overlay">
                        <div class="spinner"></div>
                    </div>

                    <!-- Connection status messages -->
                    <div class="player-status-message">Select a channel to start streaming</div>

                    <!-- Custom Player Controls Panel -->
                    <div class="player-controls-panel">
                        <div class="controls-row">
                            <div class="controls-group">
                                <button id="player-play" class="player-btn" title="Play/Pause (Space)">
                                    <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                </button>
                                <button id="player-stop" class="player-btn" title="Stop">
                                    <svg viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
                                </button>
                                <button id="player-reload" class="player-btn" title="Reload Stream">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                                </button>
                                <div class="volume-container">
                                    <button id="player-mute" class="player-btn" title="Mute (M)">
                                        <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                                    </button>
                                    <input type="range" id="player-volume" class="volume-slider" min="0" max="1" step="0.05" value="0.8">
                                </div>
                                <div class="live-badge">
                                    <div class="live-dot"></div>
                                    <span>LIVE</span>
                                </div>
                            </div>

                            <div class="controls-group">
                                <select id="player-speed" class="speed-selector" title="Playback Speed">
                                    <option value="0.5">0.5x</option>
                                    <option value="0.75">0.75x</option>
                                    <option value="1.0" selected>Normal</option>
                                    <option value="1.25">1.25x</option>
                                    <option value="1.5">1.5x</option>
                                    <option value="2.0">2x</option>
                                </select>
                                <button id="player-screenshot" class="player-btn" title="Take Screenshot">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                </button>
                                <button id="player-theater" class="player-btn" title="Theater Mode">
                                    <svg viewBox="0 0 24 24"><path d="M19 19H5V5h14v14zm0-16H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
                                </button>
                                <button id="player-pip" class="player-btn" title="Picture-in-Picture">
                                    <svg viewBox="0 0 24 24"><path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z"/></svg>
                                </button>
                                <button id="player-fullscreen" class="player-btn" title="Fullscreen (F)">
                                    <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stream Metadata Info Card -->
                <div class="stream-info-card">
                    <div class="stream-meta-header">
                        <div class="stream-title" id="stream-title">No Channel Selected</div>
                        <div class="stream-tags">
                            <span class="badge badge-hd" id="stream-category">General</span>
                            <span class="badge badge-cat" id="stream-country">Global</span>
                            <span class="badge badge-cat" id="stream-language">Urdu</span>
                        </div>
                    </div>
                </div>

                <!-- Shelf: Favorites -->
                <div id="fav-shelf-wrapper" class="horizontal-shelf" style="display: none;">
                    <div class="section-title">
                        <span>Favorite Channels</span>
                    </div>
                    <div id="fav-shelf-scroll" class="shelf-scroll"></div>
                </div>

                <!-- Shelf: Watch History -->
                <div id="history-shelf-wrapper" class="horizontal-shelf" style="display: none;">
                    <div class="section-title">
                        <span>Recently Watched</span>
                    </div>
                    <div id="history-shelf-scroll" class="shelf-scroll"></div>
                </div>

            </div>
        </main>
    </div>

    <!-- HLS.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <script src="/js/player.js"></script>
    <script src="/js/app.js"></script>
</body>
</html>
