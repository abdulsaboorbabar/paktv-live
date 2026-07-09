// js/app.js

document.addEventListener('DOMContentLoaded', () => {
  // App state
  const state = {
    channels: [],
    favorites: JSON.parse(localStorage.getItem('paktv_favorites')) || [],
    history: JSON.parse(localStorage.getItem('paktv_history')) || [],
    filters: {
      search: '',
      country: '',
      category: '',
      language: '',
      hd: 0,
      favoritesOnly: false,
      onlineOnly: 1
    },
    pagination: {
      limit: 40,
      offset: 0,
      hasMore: true,
      loading: false
    },
    deferredPrompt: null
  };

  // DOM Elements
  const videoEl = document.getElementById('main-video');
  const playerContainer = document.getElementById('player-container');
  const channelsGrid = document.getElementById('channels-grid');
  
  // Filters
  const searchInput = document.getElementById('search-input');
  const countrySelect = document.getElementById('country-select');
  const categorySelect = document.getElementById('category-select');
  const languageSelect = document.getElementById('language-select');
  const hdCheckbox = document.getElementById('hd-checkbox');
  const favoritesCheckbox = document.getElementById('favorites-checkbox');
  
  // Shelf sections
  const favShelfWrapper = document.getElementById('fav-shelf-wrapper');
  const favShelfScroll = document.getElementById('fav-shelf-scroll');
  const historyShelfWrapper = document.getElementById('history-shelf-wrapper');
  const historyShelfScroll = document.getElementById('history-shelf-scroll');

  // Headers
  const refreshBtn = document.getElementById('refresh-btn');
  const installBtn = document.getElementById('install-btn');
  const onlineStatus = document.getElementById('online-status');
  const streamTitle = document.getElementById('stream-title');
  const streamCategory = document.getElementById('stream-category');
  const streamCountry = document.getElementById('stream-country');
  const streamLanguage = document.getElementById('stream-language');
  
  // Custom Player Controls
  const playBtn = document.getElementById('player-play');
  const stopBtn = document.getElementById('player-stop');
  const muteBtn = document.getElementById('player-mute');
  const volumeSlider = document.getElementById('player-volume');
  const speedSelector = document.getElementById('player-speed');
  const screenshotBtn = document.getElementById('player-screenshot');
  const pipBtn = document.getElementById('player-pip');
  const fullscreenBtn = document.getElementById('player-fullscreen');
  const reloadBtn = document.getElementById('player-reload');
  const theaterBtn = document.getElementById('player-theater');

  // Initialize PakPlayer instance
  const player = new PakPlayer(videoEl, playerContainer);

  // Load select filters
  loadFilterOptions();

  // Load channels initially
  fetchChannels(true);
  updateShelves();

  // Setup custom player control click bindings
  if (playBtn) playBtn.addEventListener('click', () => player.togglePlay());
  if (stopBtn) stopBtn.addEventListener('click', () => player.stop());
  if (muteBtn) muteBtn.addEventListener('click', () => player.toggleMute());
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => player.setVolume(e.target.value));
  }
  if (speedSelector) {
    speedSelector.addEventListener('change', (e) => player.setPlaybackSpeed(parseFloat(e.target.value)));
  }
  if (screenshotBtn) screenshotBtn.addEventListener('click', () => player.takeScreenshot());
  if (pipBtn) pipBtn.addEventListener('click', () => player.togglePip());
  if (fullscreenBtn) fullscreenBtn.addEventListener('click', () => player.toggleFullscreen());
  if (reloadBtn) reloadBtn.addEventListener('click', () => player.loadStream(player.streamUrl));
  if (theaterBtn) theaterBtn.addEventListener('click', () => player.toggleTheaterMode());

  // Listeners for filters
  let debounceTimeout = null;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      state.filters.search = e.target.value;
      fetchChannels(true);
    }, 250);
  });

  countrySelect.addEventListener('change', (e) => {
    state.filters.country = e.target.value;
    fetchChannels(true);
  });

  categorySelect.addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    fetchChannels(true);
  });

  languageSelect.addEventListener('change', (e) => {
    state.filters.language = e.target.value;
    fetchChannels(true);
  });

  hdCheckbox.addEventListener('change', (e) => {
    state.filters.hd = e.target.checked ? 1 : 0;
    fetchChannels(true);
  });

  favoritesCheckbox.addEventListener('change', (e) => {
    state.filters.favoritesOnly = e.target.checked;
    fetchChannels(true);
  });

  refreshBtn.addEventListener('click', () => {
    fetchChannels(true);
    loadFilterOptions();
  });

  // Load filters from API
  function loadFilterOptions() {
    fetch('/api/countries.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          countrySelect.innerHTML = '<option value="">All Countries</option>';
          data.countries.forEach(c => {
            countrySelect.innerHTML += `<option value="${c}">${c}</option>`;
          });
        }
      });

    fetch('/api/categories.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          categorySelect.innerHTML = '<option value="">All Categories</option>';
          data.categories.forEach(c => {
            categorySelect.innerHTML += `<option value="${c}">${c}</option>`;
          });
        }
      });

    fetch('/api/languages.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          languageSelect.innerHTML = '<option value="">All Languages</option>';
          data.languages.forEach(l => {
            languageSelect.innerHTML += `<option value="${l}">${l}</option>`;
          });
        }
      });
  }

  // Fetch Channels
  function fetchChannels(reset = false) {
    if (state.pagination.loading) return;
    if (reset) {
      state.pagination.offset = 0;
      state.pagination.hasMore = true;
      channelsGrid.innerHTML = '';
    }

    if (!state.pagination.hasMore) return;
    state.pagination.loading = true;

    // Show buffering status or loading in grid
    if (reset) {
      channelsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">Loading channels...</div>';
    }

    // Build URL query parameters
    let url = `/api/channels.php?limit=${state.pagination.limit}&offset=${state.pagination.offset}`;
    if (state.filters.search) url += `&search=${encodeURIComponent(state.filters.search)}`;
    if (state.filters.country) url += `&country=${encodeURIComponent(state.filters.country)}`;
    if (state.filters.category) url += `&category=${encodeURIComponent(state.filters.category)}`;
    if (state.filters.language) url += `&language=${encodeURIComponent(state.filters.language)}`;
    if (state.filters.hd) url += `&hd=1`;
    if (state.filters.onlineOnly) url += `&online=1`;

    // Handle Favorites only filter
    if (state.filters.favoritesOnly) {
      if (state.favorites.length === 0) {
        channelsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">No favorite channels added yet.</div>';
        state.pagination.loading = false;
        return;
      }
      url = `/api/favorites.php?ids=${state.favorites.join(',')}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (reset) channelsGrid.innerHTML = '';
        
        if (data.success) {
          const channels = data.channels || [];
          if (channels.length === 0 && reset) {
            channelsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">No channels found matching the filters.</div>';
          } else {
            renderChannels(channels, channelsGrid);
          }

          if (state.filters.favoritesOnly) {
            state.pagination.hasMore = false;
          } else {
            state.pagination.offset += channels.length;
            if (channels.length < state.pagination.limit) {
              state.pagination.hasMore = false;
            }
          }
        }
      })
      .catch(err => {
        console.error(err);
        if (reset) channelsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #ef4444;">Failed to load channels.</div>';
      })
      .finally(() => {
        state.pagination.loading = false;
      });
  }

  // Render Channels grid
  function renderChannels(channels, container, append = true) {
    if (!append) container.innerHTML = '';

    channels.forEach(ch => {
      const isFav = state.favorites.includes(ch.id);
      const card = document.createElement('div');
      card.className = 'channel-card';
      card.dataset.id = ch.id;
      
      const logo = ch.logo_url ? ch.logo_url : '/icons/icon-192.png';

      card.innerHTML = `
        <div class="logo-container">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" data-src="${logo}" class="lazy-logo" alt="${ch.name}">
        </div>
        <div class="info-container">
          <div class="channel-name">${ch.name}</div>
          <div class="meta-row">
            <span class="badge badge-cat">${ch.category || 'TV'}</span>
            <span>${ch.country || ''}</span>
            ${ch.is_hd ? '<span class="badge badge-hd">HD</span>' : ''}
          </div>
        </div>
        <button class="favorite-btn ${isFav ? 'is-fav' : ''}" data-id="${ch.id}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      `;

      // Event: Play Stream
      card.addEventListener('click', (e) => {
        if (e.target.closest('.favorite-btn')) return;
        playChannel(ch);
      });

      // Event: Toggle Favorite
      const favBtn = card.querySelector('.favorite-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(ch.id);
        favBtn.classList.toggle('is-fav');
      });

      container.appendChild(card);
    });

    lazyLoadLogos();
  }

  // Play Channel
  function playChannel(channel) {
    player.loadStream(channel.stream_url);
    
    // Update active state in list
    document.querySelectorAll('.channel-card').forEach(card => {
      if (card.dataset.id == channel.id) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Update Meta info panel
    if (streamTitle) streamTitle.textContent = channel.name;
    if (streamCategory) streamCategory.textContent = channel.category || 'General';
    if (streamCountry) streamCountry.textContent = channel.country || 'Global';
    if (streamLanguage) streamLanguage.textContent = channel.language || 'Unknown';

    // Store in history
    addToHistory(channel.id);
    updateShelves();

    // Scroll to player on small viewports
    if (window.innerWidth <= 992) {
      playerContainer.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Toggle Favorite logic
  function toggleFavorite(id) {
    id = parseInt(id);
    const index = state.favorites.indexOf(id);
    if (index === -1) {
      state.favorites.push(id);
    } else {
      state.favorites.splice(index, 1);
    }
    localStorage.setItem('paktv_favorites', JSON.stringify(state.favorites));
    updateShelves();
  }

  // Add to watch history
  function addToHistory(id) {
    id = parseInt(id);
    const index = state.history.indexOf(id);
    if (index !== -1) {
      state.history.splice(index, 1);
    }
    state.history.unshift(id); // Place at top of history list
    
    // Cap history size to 15
    if (state.history.length > 15) {
      state.history.pop();
    }
    
    localStorage.setItem('paktv_history', JSON.stringify(state.history));
  }

  // Update shelf channels (Favorites / Watch History shelves)
  function updateShelves() {
    // Favorites shelf
    if (state.favorites.length > 0) {
      favShelfWrapper.style.display = 'block';
      fetch(`/api/favorites.php?ids=${state.favorites.join(',')}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            favShelfScroll.innerHTML = '';
            renderChannels(data.channels, favShelfScroll);
          }
        });
    } else {
      favShelfWrapper.style.display = 'none';
    }

    // Watch History shelf
    if (state.history.length > 0) {
      historyShelfWrapper.style.display = 'block';
      fetch(`/api/history.php?ids=${state.history.join(',')}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            historyShelfScroll.innerHTML = '';
            renderChannels(data.channels, historyShelfScroll);
          }
        });
    } else {
      historyShelfWrapper.style.display = 'none';
    }
  }

  // Lazy loading image handler
  function lazyLoadLogos() {
    const lazyImages = document.querySelectorAll('.lazy-logo');
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy-logo');
            observer.unobserve(img);
          }
        });
      });
      lazyImages.forEach(img => observer.observe(img));
    } else {
      lazyImages.forEach(img => {
        img.src = img.dataset.src;
      });
    }
  }

  // Infinite Scroll for channels list
  const listWrapper = document.querySelector('.channels-list-wrapper');
  listWrapper.addEventListener('scroll', () => {
    if (listWrapper.scrollTop + listWrapper.clientHeight >= listWrapper.scrollHeight - 50) {
      if (!state.filters.favoritesOnly) {
        fetchChannels();
      }
    }
  });

  // Online Status Indicator
  function updateOnlineStatus() {
    if (navigator.onLine) {
      onlineStatus.classList.remove('offline');
      onlineStatus.querySelector('span').textContent = 'Online';
    } else {
      onlineStatus.classList.add('offline');
      onlineStatus.querySelector('span').textContent = 'Offline';
    }
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // PWA Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker Registered successfully', reg.scope))
      .catch(err => console.warn('Service Worker registration failed', err));
  }

  // Capture PWA Install Prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
    installBtn.style.display = 'flex';
  });

  installBtn.addEventListener('click', () => {
    if (!state.deferredPrompt) return;
    state.deferredPrompt.prompt();
    state.deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
      }
      state.deferredPrompt = null;
      installBtn.style.display = 'none';
    });
  });
});
