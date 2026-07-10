// js/app.js

document.addEventListener('DOMContentLoaded', () => {

  // ── State ──────────────────────────────────────────────────────────────────
  let imgObserver;
  const state = {
    favorites:     JSON.parse(localStorage.getItem('paktv_fav')  || '[]'),
    history:       JSON.parse(localStorage.getItem('paktv_hist') || '[]'),
    filters:       { q: '', country: '', category: '', language: '', hd: false, favOnly: false },
    deferredPrompt: null,
    currentChannel: null,
  };

  const store = new ChannelStore();

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const videoEl         = $('main-video');
  const playerContainer = $('player-container');
  const channelsGrid    = $('channels-grid');
  const searchInput     = $('sidebar-search-input');
  const countrySelect   = $('country-select');
  const languageSelect  = $('language-select');
  const hdCheckbox      = $('hd-checkbox');
  const favCheckbox     = $('fav-checkbox');
  const refreshBtn      = $('refresh-btn');
  const installBtn      = $('install-btn');
  const onlineStatus    = $('online-status');
  const streamTitle     = $('stream-title');
  const streamCategory  = $('stream-category');
  const streamCountry   = $('stream-country');
  const streamLanguage  = $('stream-language');
  const favWrapper      = $('fav-shelf-wrapper');
  const favScroll       = $('fav-shelf-scroll');
  const histWrapper     = $('history-shelf-wrapper');
  const histScroll      = $('history-shelf-scroll');
  const channelCount    = $('channel-count');
  const importModal     = $('import-modal');
  const importBtn       = $('import-btn');
  const importClose     = $('import-close');
  const importUrlInput  = $('import-url');
  const importFetchBtn  = $('import-fetch-btn');
  const importFile      = $('import-file');
  const importStatus    = $('import-status');
  const categoryChipsContainer = $('category-chips');
  const filterToggleBtn        = $('filter-toggle-btn');
  const advancedFiltersPanel   = $('advanced-filters');

  // ── Init Player ────────────────────────────────────────────────────────────
  const player = new PakPlayer(videoEl, playerContainer);

  // Wire player controls
  const wire = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
  wire('player-play',       () => player.togglePlay());
  wire('player-stop',       () => player.stop());
  wire('player-reload',     () => player.loadStream(player.streamUrl));
  wire('player-mute',       () => player.toggleMute());
  wire('player-screenshot', () => player.takeScreenshot());
  wire('player-pip',        () => player.togglePip());
  wire('player-fullscreen', () => player.toggleFullscreen());
  wire('player-theater',    () => player.toggleTheaterMode());

  const volSlider  = $('player-volume');
  const speedSel   = $('player-speed');
  if (volSlider) volSlider.addEventListener('input', e => player.setVolume(parseFloat(e.target.value)));
  if (speedSel)  speedSel.addEventListener('change', e => player.setPlaybackSpeed(parseFloat(e.target.value)));

  // ── Load channels & boot ───────────────────────────────────────────────────
  showGridLoading();

  store.init((channels, msg) => {
    if (msg) {
      return;
    }
    if (channels) {
      populateFilterDropdowns();
      renderCategoryChips();
      renderGrid();
      updateShelves();
    }
  });

  // ── Filter event listeners ─────────────────────────────────────────────────
  let debounce = null;
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        state.filters.q = e.target.value;
        renderGrid();
      }, 200);
    });
  }

  if (countrySelect) {
    countrySelect.addEventListener('change', async e => {
      const selectedCountry = e.target.value;
      state.filters.country = selectedCountry;
      
      if (selectedCountry) {
        const code = IPTV_ORG_COUNTRIES[selectedCountry];
        const hasChannels = store.all.some(c => c.country === selectedCountry);
        
        if (!hasChannels && code) {
          showGridLoading();
          await store.loadCountry(code, (channels) => {
            if (channels) {
              populateFilterDropdowns();
              renderCategoryChips();
              renderGrid();
            }
          });
        } else {
          renderGrid();
        }
      } else {
        renderGrid();
      }
    });
  }

  if (languageSelect) {
    languageSelect.addEventListener('change', e => { state.filters.language = e.target.value; renderGrid(); });
  }
  if (hdCheckbox) {
    hdCheckbox.addEventListener('change', e => { state.filters.hd = e.target.checked; renderGrid(); });
  }
  if (favCheckbox) {
    favCheckbox.addEventListener('change', e => { state.filters.favOnly = e.target.checked; renderGrid(); });
  }

  if (filterToggleBtn && advancedFiltersPanel) {
    filterToggleBtn.addEventListener('click', () => {
      advancedFiltersPanel.classList.toggle('collapsed');
      filterToggleBtn.classList.toggle('active');
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      showGridLoading();
      store.init((channels) => {
        if (channels) { 
          populateFilterDropdowns(); 
          renderCategoryChips();
          renderGrid(); 
          updateShelves(); 
        }
      });
    });
  }

  // ── Category Chips ─────────────────────────────────────────────────────────
  function renderCategoryChips() {
    if (!categoryChipsContainer) return;
    const categories = ['All', ...store.categories];
    categoryChipsContainer.innerHTML = '';
    categories.forEach(cat => {
      const chip = document.createElement('button');
      chip.className = 'category-chip' + (state.filters.category === cat || (cat === 'All' && !state.filters.category) ? ' active' : '');
      chip.textContent = cat;
      chip.addEventListener('click', () => {
        state.filters.category = cat === 'All' ? '' : cat;
        document.querySelectorAll('.category-chip').forEach(el => {
          el.classList.toggle('active', el.textContent === cat);
        });
        renderGrid();
      });
      categoryChipsContainer.appendChild(chip);
    });
  }

  // ── Filter dropdowns ───────────────────────────────────────────────────────
  function populateFilterDropdowns() {
    populateSelect(countrySelect, Object.keys(IPTV_ORG_COUNTRIES), 'All Countries');
    populateSelect(languageSelect, store.languages,  'All Languages');
  }

  function populateSelect(el, items, placeholder) {
    const current = el.value;
    el.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      if (item === current) opt.selected = true;
      el.appendChild(opt);
    });
  }

  // ── Render channel grid ────────────────────────────────────────────────────
  function renderGrid() {
    const filters = {
      q:        state.filters.q,
      country:  state.filters.country,
      category: state.filters.category,
      language: state.filters.language,
      hd:       state.filters.hd,
      favIds:   state.filters.favOnly ? state.favorites : null,
    };

    const channels = store.search(filters);

    if (channelCount) channelCount.textContent = channels.length;

    channelsGrid.innerHTML = '';

    if (channels.length === 0) {
      channelsGrid.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>
          <p>No channels found</p>
          <small>Try adjusting your filters or <button class="link-btn" id="clear-filters-btn">clear all filters</button></small>
        </div>`;
      const clr = $('clear-filters-btn');
      if (clr) clr.addEventListener('click', clearFilters);
      return;
    }

    const frag = document.createDocumentFragment();
    channels.forEach(ch => frag.appendChild(buildCard(ch)));
    channelsGrid.appendChild(frag);
    observeLazyImages();
  }

  function clearFilters() {
    state.filters = { q: '', country: '', category: '', language: '', hd: false, favOnly: false };
    searchInput.value = '';
    countrySelect.value = '';
    categorySelect.value = '';
    languageSelect.value = '';
    hdCheckbox.checked = false;
    favCheckbox.checked = false;
    renderGrid();
  }

  // ── Channel Card ───────────────────────────────────────────────────────────
  function buildCard(ch) {
    const isFav = state.favorites.includes(ch.id);
    const card  = document.createElement('div');
    card.className = 'channel-card';
    card.dataset.id = ch.id;

    const logoSrc = ch.logo_url || ch.logo || '';

    card.innerHTML = `
      <div class="logo-container">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"
             data-src="${logoSrc}"
             alt="${ch.name}"
             class="lazy-logo channel-logo"
             onerror="this.src='/icons/tv-placeholder.svg'">
      </div>
      <div class="info-container">
        <div class="channel-name">${ch.name}</div>
        <div class="meta-row">
          <span class="badge badge-cat">${ch.category || 'TV'}</span>
          ${ch.country ? `<span class="meta-country">${ch.country}</span>` : ''}
          ${ch.is_hd ? '<span class="badge badge-hd">HD</span>' : ''}
          ${ch.is_http ? '<span class="badge badge-cat" style="color:#ef4444; border: 1px solid rgba(239,68,68,0.25)">Local HTTP</span>' : ''}
        </div>
      </div>
      <button class="favorite-btn ${isFav ? 'is-fav' : ''}" data-id="${ch.id}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      </button>`;

    card.addEventListener('click', e => {
      if (e.target.closest('.favorite-btn')) return;
      playChannel(ch);
    });

    card.querySelector('.favorite-btn').addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(ch.id);
      e.currentTarget.classList.toggle('is-fav');
    });

    return card;
  }

  // ── Play ───────────────────────────────────────────────────────────────────
  function playChannel(ch) {
    state.currentChannel = ch;
    player.loadStream(ch.stream_url);

    document.querySelectorAll('.channel-card').forEach(c =>
      c.classList.toggle('active', c.dataset.id == ch.id)
    );

    if (streamTitle)    streamTitle.textContent    = ch.name;
    if (streamCategory) streamCategory.textContent = ch.category || 'General';
    if (streamCountry)  streamCountry.textContent  = ch.country  || 'Global';
    if (streamLanguage) streamLanguage.textContent = ch.language || '—';

    addToHistory(ch.id);
    updateShelves();

    // Scroll player into view on mobile/tablet
    if (window.innerWidth <= 992) {
      playerContainer.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // ── Favorites ──────────────────────────────────────────────────────────────
  function toggleFavorite(id) {
    const idx = state.favorites.indexOf(id);
    if (idx === -1) state.favorites.push(id);
    else            state.favorites.splice(idx, 1);
    localStorage.setItem('paktv_fav', JSON.stringify(state.favorites));
    updateShelves();
  }

  // ── History ────────────────────────────────────────────────────────────────
  function addToHistory(id) {
    const idx = state.history.indexOf(id);
    if (idx !== -1) state.history.splice(idx, 1);
    state.history.unshift(id);
    if (state.history.length > 15) state.history.pop();
    localStorage.setItem('paktv_hist', JSON.stringify(state.history));
  }

  // ── Shelves ────────────────────────────────────────────────────────────────
  function updateShelves() {
    // Favorites shelf
    if (state.favorites.length > 0) {
      favWrapper.style.display = 'block';
      favScroll.innerHTML = '';
      store.getById(state.favorites).forEach(ch => favScroll.appendChild(buildCard(ch)));
      observeLazyImages();
    } else {
      favWrapper.style.display = 'none';
    }

    // History shelf
    if (state.history.length > 0) {
      histWrapper.style.display = 'block';
      histScroll.innerHTML = '';
      store.getById(state.history).forEach(ch => histScroll.appendChild(buildCard(ch)));
      observeLazyImages();
    } else {
      histWrapper.style.display = 'none';
    }
  }

  // ── Lazy image loading ─────────────────────────────────────────────────────
  function observeLazyImages() {
    const imgs = document.querySelectorAll('.lazy-logo[data-src]');
    if ('IntersectionObserver' in window) {
      if (!imgObserver) {
        imgObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                delete img.dataset.src;
              }
              imgObserver.unobserve(img);
            }
          });
        }, { rootMargin: '100px' });
      }
      imgs.forEach(img => imgObserver.observe(img));
    } else {
      imgs.forEach(img => { img.src = img.dataset.src; delete img.dataset.src; });
    }
  }

  // ── Grid loading state ─────────────────────────────────────────────────────
  function showGridLoading() {
    channelsGrid.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading channels...</p>
      </div>`;
  }

  // ── Online Status ──────────────────────────────────────────────────────────
  function updateOnlineStatus() {
    const online = navigator.onLine;
    onlineStatus.classList.toggle('offline', !online);
    onlineStatus.querySelector('span').textContent = online ? 'Online' : 'Offline';
  }
  window.addEventListener('online',  updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // ── PWA Service Worker ────────────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(r  => console.log('SW registered:', r.scope))
      .catch(e => console.warn('SW failed:', e));
  }

  // ── PWA Install Prompt ────────────────────────────────────────────────────
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    state.deferredPrompt = e;
    installBtn.style.display = 'flex';
  });

  installBtn.addEventListener('click', () => {
    if (!state.deferredPrompt) return;
    state.deferredPrompt.prompt();
    state.deferredPrompt.userChoice.then(() => {
      state.deferredPrompt = null;
      installBtn.style.display = 'none';
    });
  });

  // ── Import Modal ──────────────────────────────────────────────────────────
  importBtn.addEventListener('click', () => {
    importModal.classList.add('open');
    importStatus.textContent = '';
    importUrlInput.value = '';
    // Load saved proxy URL
    const proxyInput = $('proxy-url');
    if (proxyInput) proxyInput.value = localStorage.getItem('paktv_proxy') || '';
  });

  importClose.addEventListener('click', () => importModal.classList.remove('open'));
  importModal.addEventListener('click', e => { if (e.target === importModal) importModal.classList.remove('open'); });

  // Proxy Save
  const proxySaveBtn = $('proxy-save-btn');
  const proxyStatus  = $('proxy-status');
  if (proxySaveBtn) {
    proxySaveBtn.addEventListener('click', () => {
      const val = ($('proxy-url').value || '').trim().replace(/\/$/, '');
      if (val && !val.startsWith('https://')) {
        proxyStatus.textContent = '✗ Proxy URL must start with https://';
        proxyStatus.className = 'import-status error';
        return;
      }
      localStorage.setItem('paktv_proxy', val);
      proxyStatus.textContent = val
        ? `✓ Proxy saved! Reload the page once to activate.`
        : '✓ Proxy cleared.';
      proxyStatus.className = 'import-status success';
    });
  }

  // Quick-load iptv-org country buttons
  document.querySelectorAll('.iptv-org-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const code = btn.dataset.code;
      importStatus.textContent = `Fetching ${btn.textContent} channels...`;
      importStatus.className = 'import-status loading';
      try {
        const channels = await fetchIPTVOrg(code);
        const added = store.add(channels);
        populateFilterDropdowns();
        renderGrid();
        importStatus.textContent = `✓ Added ${added} new channels from ${btn.textContent}`;
        importStatus.className = 'import-status success';
      } catch (e) {
        importStatus.textContent = `✗ Failed: ${e.message}`;
        importStatus.className = 'import-status error';
      }
    });
  });

  // Fetch from custom URL
  importFetchBtn.addEventListener('click', async () => {
    const url = importUrlInput.value.trim();
    if (!url) return;
    importStatus.textContent = 'Fetching...';
    importStatus.className = 'import-status loading';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const channels = parseM3U(text);
      const added = store.add(channels);
      populateFilterDropdowns();
      renderGrid();
      importStatus.textContent = `✓ Added ${added} new channels`;
      importStatus.className = 'import-status success';
    } catch (e) {
      importStatus.textContent = `✗ Failed: ${e.message}. Try using a CORS proxy or paste the file.`;
      importStatus.className = 'import-status error';
    }
  });

  // Load from local .m3u file
  importFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const channels = parseM3U(ev.target.result);
      const added = store.add(channels);
      populateFilterDropdowns();
      renderGrid();
      importStatus.textContent = `✓ Loaded ${added} channels from file`;
      importStatus.className = 'import-status success';
    };
    reader.readAsText(file);
  });

});
