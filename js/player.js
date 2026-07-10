// js/player.js

class PakPlayer {
  constructor(videoElement, containerElement) {
    this.video = videoElement;
    this.container = containerElement;
    this.hls = null;
    
    this.streamUrl = "";
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 3000; // 3 seconds
    this.isPlaying = false;
    
    // Preferences
    this.volume = parseFloat(localStorage.getItem('pakplayer_volume')) || 0.8;
    this.muted = localStorage.getItem('pakplayer_muted') === 'true';
    this.playbackSpeed = parseFloat(localStorage.getItem('pakplayer_speed')) || 1.0;
    this.theaterMode = localStorage.getItem('pakplayer_theater') === 'true';
    this.miniMode = false;

    this.init();
  }

  init() {
    this.video.volume = this.muted ? 0 : this.volume;
    this.video.muted = this.muted;
    this.video.playbackRate = this.playbackSpeed;

    this.setupEventHandlers();
    this.setupKeyboardShortcuts();
    this.updateControlsUI();
  }

  setupEventHandlers() {
    // Basic HLS.js and HTML5 video event mappings
    this.video.addEventListener('play', () => {
      this.isPlaying = true;
      this.container.classList.remove('paused');
      this.container.classList.add('playing');
      this.hideBuffer();
    });

    this.video.addEventListener('pause', () => {
      this.isPlaying = false;
      this.container.classList.remove('playing');
      this.container.classList.add('paused');
    });

    this.video.addEventListener('waiting', () => this.showBuffer());
    this.video.addEventListener('playing', () => this.hideBuffer());
    this.video.addEventListener('seeking', () => this.showBuffer());
    this.video.addEventListener('seeked', () => this.hideBuffer());
    
    this.video.addEventListener('volumechange', () => {
      this.volume = this.video.volume;
      this.muted = this.video.muted;
      localStorage.setItem('pakplayer_volume', this.volume);
      localStorage.setItem('pakplayer_muted', this.muted);
      this.updateControlsUI();
    });

    // Handle Pip State
    this.video.addEventListener('enterpictureinpicture', () => {
      this.container.classList.add('pip-mode');
    });
    this.video.addEventListener('leavepictureinpicture', () => {
      this.container.classList.remove('pip-mode');
    });
  }

  loadStream(url, isRetry = false) {
    if (!url) return;
    this.streamUrl = url;
    if (!isRetry) {
      this.retryCount = 0;
    }
    this.showBuffer();
    this.showStatus(isRetry ? `Stream disconnected. Retrying (${this.retryCount}/${this.maxRetries})...` : 'Connecting to stream...');

    if (this.hls) {
      this.hls.destroy();
    }

    if (Hls.isSupported()) {
      this.hls = new Hls({
        maxMaxBufferLength: 10,
        liveSyncDuration: 3,
        manifestLoadingMaxRetry: 4,
        manifestLoadingRetryDelay: 1000
      });
      
      this.hls.loadSource(url);
      this.hls.attachMedia(this.video);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.hideStatus();
        this.video.play().catch(e => {
          this.showStatus('Auto-play blocked. Click play to start.');
          this.hideBuffer();
        });
      });

      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('Network error encountered, trying to recover...', data);
              this.handleReconnection();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('Media error encountered, trying to recover...', data);
              this.hls.recoverMediaError();
              break;
            default:
              this.showError('Stream could not be loaded.');
              this.destroyHls();
              break;
          }
        }
      });

    } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari support
      this.video.src = url;
      this.video.addEventListener('loadedmetadata', () => {
        this.hideStatus();
        this.video.play();
      });
      this.video.addEventListener('error', () => {
        this.handleReconnection();
      });
    } else {
      this.showError('Your browser does not support HLS.js streaming.');
    }
  }

  handleReconnection() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.showBuffer();
      setTimeout(() => {
        this.loadStream(this.streamUrl, true);
      }, this.retryDelay);
    } else {
      this.showError('Stream offline or blocked. Click IMPORT (top-right) for fresh channels.');
      this.hideBuffer();
    }
  }

  destroyHls() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  togglePlay() {
    if (this.video.paused) {
      this.video.play().catch(err => console.error(err));
    } else {
      this.video.pause();
    }
  }

  stop() {
    this.video.pause();
    this.video.currentTime = 0;
    this.destroyHls();
    this.showStatus('Stream stopped.');
  }

  toggleMute() {
    this.video.muted = !this.video.muted;
  }

  setVolume(val) {
    this.video.volume = Math.max(0, Math.min(1, val));
    if (this.video.volume > 0) {
      this.video.muted = false;
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  togglePip() {
    if (document.pictureInPictureEnabled) {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      } else {
        this.video.requestPictureInPicture().catch(err => console.error(err));
      }
    }
  }

  setPlaybackSpeed(speed) {
    this.playbackSpeed = speed;
    this.video.playbackRate = speed;
    localStorage.setItem('pakplayer_speed', speed);
    this.updateControlsUI();
  }

  takeScreenshot() {
    const canvas = document.createElement('canvas');
    canvas.width = this.video.videoWidth || 640;
    canvas.height = this.video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);
    
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `paktv-screenshot-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      alert("Cannot take screenshot: Stream security blocks canvas capture.");
    }
  }

  toggleTheaterMode() {
    this.theaterMode = !this.theaterMode;
    localStorage.setItem('pakplayer_theater', this.theaterMode);
    if (this.theaterMode) {
      document.body.classList.add('theater-layout');
    } else {
      document.body.classList.remove('theater-layout');
    }
  }

  showBuffer() {
    this.container.classList.add('buffering');
  }

  hideBuffer() {
    this.container.classList.remove('buffering');
  }

  showStatus(msg) {
    const el = this.container.querySelector('.player-status-message');
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
    }
  }

  hideStatus() {
    const el = this.container.querySelector('.player-status-message');
    if (el) {
      el.style.display = 'none';
    }
  }

  showError(msg) {
    this.showStatus(msg);
    this.container.classList.add('player-error');
  }

  updateControlsUI() {
    // Sync slider controls and status elements
    const volumeSlider = this.container.querySelector('.volume-slider');
    if (volumeSlider) {
      volumeSlider.value = this.muted ? 0 : this.volume;
    }
    const speedSelect = this.container.querySelector('.speed-selector');
    if (speedSelect) {
      speedSelect.value = this.playbackSpeed;
    }
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in input search/boxes
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.togglePlay();
          break;
        case 'KeyF':
          e.preventDefault();
          this.toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          this.toggleMute();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.setVolume(this.video.volume + 0.05);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.setVolume(this.video.volume - 0.05);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          // Seek live delay offset
          this.video.currentTime -= 5;
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.video.currentTime += 5;
          break;
      }
    });
  }
}
window.PakPlayer = PakPlayer;
