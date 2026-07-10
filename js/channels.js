// js/channels.js
// Channel store: hardcoded fallback + live iptv-org M3U fetcher + parser

const FALLBACK_CHANNELS = [
  { id: 999, name: 'Mux Test Stream (Works 100%)', country: 'Global', category: 'Test', language: 'English', logo: '', is_hd: 1, stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  { id:1, name:'Discover Pakistan HD', country:'Pakistan', category:'Entertainment', language:'Urdu', logo:'https://i.imgur.com/KLrfKRn.png', is_hd:1, stream_url:'https://livecdn.live247stream.com/discoverpakistan/web/playlist.m3u8' },
  { id:2, name:'Geo News Live', country:'Pakistan', category:'News', language:'Urdu', logo:'https://raw.githubusercontent.com/nicholaswmin/country-flag-icons/master/3x2/PK.svg', is_hd:0, stream_url:'https://jk3lz82elw79-hls-live.5centscdn.com/newgeonews/07811dc6c422334ce36a09ff5cd6fe71.sdp/playlist.m3u8' },
  { id:3, name:'Dunya News HD', country:'Pakistan', category:'News', language:'Urdu', logo:'', is_hd:1, stream_url:'https://imob.dunyanews.tv/livehd/ngrp:dunyalivehd_2_all/playlist.m3u8' },
  { id:4, name:'NASA TV', country:'USA', category:'Science', language:'English', logo:'', is_hd:1, stream_url:'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8' },
  { id:5, name:'Al Jazeera English', country:'Qatar', category:'News', language:'English', logo:'', is_hd:1, stream_url:'https://live-hls-web-aje.getaj.net/AJE/index.m3u8' },
  { id:6, name:'TRT World', country:'Turkey', category:'News', language:'English', logo:'', is_hd:1, stream_url:'https://tv-trtworld.medya.trt.com.tr/master.m3u8' },
  { id:7, name:'CNA (Channel News Asia)', country:'Singapore', category:'News', language:'English', logo:'', is_hd:1, stream_url:'https://d2e1asnsl7br7b.cloudfront.net/7782e205e72f43aeb4a48ec97f66ebbe/index.m3u8' },
  { id:8, name:'CGTN', country:'China', category:'News', language:'English', logo:'', is_hd:1, stream_url:'https://news.cgtn.com/resource/live/english/cgtn-news.m3u8' },
  { id:9, name:'Red Bull TV', country:'Global', category:'Sports', language:'English', logo:'', is_hd:1, stream_url:'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8' },
];

// ── IPTV-Org country codes ────────────────────────────────────────────────────
const IPTV_ORG_COUNTRIES = {
  'Pakistan':       'pk',
  'India':          'in',
  'USA':            'us',
  'United Kingdom': 'gb',
  'Saudi Arabia':   'sa',
  'UAE':            'ae',
  'Turkey':         'tr',
  'Qatar':          'qa',
  'Canada':         'ca',
  'Australia':      'au',
  'Germany':        'de',
  'France':         'fr',
  'Italy':          'it',
  'Spain':          'es',
  'Bangladesh':     'bd',
  'Afghanistan':    'af',
  'Iran':           'ir',
  'China':          'cn',
};

// ── M3U Parser ────────────────────────────────────────────────────────────────
function parseM3U(text, defaultCountry = '') {
  const lines   = text.split('\n');
  const results = [];
  let   idCtr   = Date.now();
  let   meta    = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      meta = { raw: line };

      // Extract attributes
      const attr = (key) => {
        const m = line.match(new RegExp(`${key}="([^"]*)"`, 'i'));
        return m ? m[1].trim() : '';
      };

      meta.logo     = attr('tvg-logo');
      meta.epg_id   = attr('tvg-id');
      meta.category = attr('group-title') || 'Entertainment';
      meta.country  = attr('tvg-country') || defaultCountry;
      meta.language = attr('tvg-language') || '';

      // Channel name is after the last comma
      const ci = line.lastIndexOf(',');
      meta.name = ci !== -1 ? line.slice(ci + 1).trim() : 'Unknown Channel';

      // Smart category fix
      const n = meta.name.toLowerCase();
      if (n.includes('news'))                                 meta.category = 'News';
      if (n.includes('sport') || n.includes('cricket'))      meta.category = 'Sports';
      if (n.includes('movie') || n.includes('cinema'))       meta.category = 'Movies';
      if (n.includes('music') || n.includes('songs'))        meta.category = 'Music';
      if (n.includes('kids') || n.includes('cartoon'))       meta.category = 'Kids';
      if (n.includes('quran') || n.includes('islam') || n.includes('peace tv')) meta.category = 'Religious';

      // HD detection
      meta.is_hd = /\bhd\b/i.test(meta.name) || /\bhd\b/i.test(meta.logo) ? 1 : 0;

    } else if (meta && !line.startsWith('#')) {
      // This line is the stream URL
      if (line.startsWith('http')) {
        results.push({
          id:         ++idCtr,
          name:       meta.name,
          stream_url: line,
          country:    meta.country,
          category:   meta.category,
          language:   meta.language,
          logo_url:   meta.logo,
          epg_id:     meta.epg_id,
          is_hd:      meta.is_hd,
          is_http:    line.startsWith('http://'),
        });
      }
      meta = null;
    }
  }
  return results;
}

// ── Live fetch from iptv-org ──────────────────────────────────────────────────
async function fetchIPTVOrg(countryCode) {
  const url = `https://iptv-org.github.io/iptv/countries/${countryCode}.m3u`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const countryName = Object.keys(IPTV_ORG_COUNTRIES).find(k => IPTV_ORG_COUNTRIES[k] === countryCode) || countryCode.toUpperCase();
  return parseM3U(text, countryName);
}

// ── Channel Store ─────────────────────────────────────────────────────────────
class ChannelStore {
  constructor() {
    this._channels = [];
    this._loaded   = false;
  }

  async init(onProgress) {
    // Always start with fallback immediately
    this._channels = [...FALLBACK_CHANNELS];
    this._loaded   = true;
    if (onProgress) onProgress(this._channels);

    // Then try to fetch live Pakistan channels from iptv-org
    try {
      if (onProgress) onProgress(null, 'Fetching live channels from iptv-org...');
      const live = await fetchIPTVOrg('pk');

      if (live.length > 0) {
        // Merge: live channels first, then any fallback channels whose name
        // doesn't already exist in the live set
        const liveNames = new Set(live.map(c => c.name.toLowerCase()));
        const extra     = FALLBACK_CHANNELS.filter(c => !liveNames.has(c.name.toLowerCase()));
        this._channels  = [...live, ...extra];
        if (onProgress) onProgress(this._channels);
      }
    } catch (e) {
      console.warn('iptv-org fetch failed, using fallback data.', e.message);
      if (onProgress) onProgress(this._channels);
    }
  }

  async loadCountry(countryCode, onProgress) {
    if (onProgress) onProgress(null, `Fetching channels for ${countryCode}...`);
    try {
      const live = await fetchIPTVOrg(countryCode);
      if (live.length > 0) {
        const existingUrls = new Set(this._channels.map(c => c.stream_url));
        const newOnes = live.filter(c => !existingUrls.has(c.stream_url));
        this._channels = [...this._channels, ...newOnes];
      }
      if (onProgress) onProgress(this._channels);
      return true;
    } catch (e) {
      console.warn(`Failed to fetch country ${countryCode}:`, e.message);
      if (onProgress) onProgress(this._channels, `Failed to load channels for ${countryCode}`);
      return false;
    }
  }

  add(channels) {
    // Merge imported channels (avoid duplicate stream URLs)
    const existing = new Set(this._channels.map(c => c.stream_url));
    const newOnes  = channels.filter(c => !existing.has(c.stream_url));
    this._channels = [...this._channels, ...newOnes];
    return newOnes.length;
  }

  search(filters) {
    let results = this._channels;

    const { q, country, category, language, hd, favIds } = filters;

    if (favIds && favIds.length > 0) {
      const favSet = new Set(favIds);
      return results.filter(c => favSet.has(c.id));
    }

    if (q) {
      const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      results = results.filter(c =>
        words.every(w =>
          c.name.toLowerCase().includes(w) ||
          (c.country   || '').toLowerCase().includes(w) ||
          (c.category  || '').toLowerCase().includes(w) ||
          (c.language  || '').toLowerCase().includes(w)
        )
      );
    }

    if (country)  results = results.filter(c => c.country  === country);
    if (category) results = results.filter(c => c.category === category);
    if (language) results = results.filter(c => c.language === language);
    if (hd)       results = results.filter(c => c.is_hd    === 1);

    // Pakistan first
    results = results.slice().sort((a, b) => {
      if (a.country === 'Pakistan' && b.country !== 'Pakistan') return -1;
      if (b.country === 'Pakistan' && a.country !== 'Pakistan') return  1;
      return a.name.localeCompare(b.name);
    });

    return results;
  }

  getById(ids) {
    const map = Object.fromEntries(this._channels.map(c => [c.id, c]));
    return ids.map(id => map[id]).filter(Boolean);
  }

  get countries()  { return [...new Set(this._channels.map(c => c.country).filter(Boolean))].sort(); }
  get categories() { return [...new Set(this._channels.map(c => c.category).filter(Boolean))].sort(); }
  get languages()  { return [...new Set(this._channels.map(c => c.language).filter(Boolean))].sort(); }
  get all()        { return this._channels; }
}

window.ChannelStore   = ChannelStore;
window.parseM3U       = parseM3U;
window.fetchIPTVOrg   = fetchIPTVOrg;
window.IPTV_ORG_COUNTRIES = IPTV_ORG_COUNTRIES;
