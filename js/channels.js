// js/channels.js
// Channel store: hardcoded fallback + live iptv-org M3U fetcher + parser

// ── Fallback channel list (used when iptv-org fetch fails) ───────────────────
const FALLBACK_CHANNELS = [
  // Pakistan – News
  { id:1,  name:'Geo News',         country:'Pakistan', category:'News',          language:'Urdu',    logo:'https://raw.githubusercontent.com/nicholaswmin/country-flag-icons/master/3x2/PK.svg',    is_hd:0, stream_url:'https://geo-sd.geo.tv/live/geo-news.m3u8' },
  { id:2,  name:'ARY News',         country:'Pakistan', category:'News',          language:'Urdu',    logo:'https://i.imgur.com/pJM0iLf.png', is_hd:0, stream_url:'https://arynews-live.geo.tv/live/ary-news.m3u8' },
  { id:3,  name:'Dunya News',       country:'Pakistan', category:'News',          language:'Urdu',    logo:'', is_hd:0, stream_url:'https://dunyanews.tv/live/dunyanews.m3u8' },
  { id:4,  name:'Samaa TV',         country:'Pakistan', category:'News',          language:'Urdu',    logo:'', is_hd:0, stream_url:'https://live.samaadigital.com/samaadigital.m3u8' },
  { id:5,  name:'Express News',     country:'Pakistan', category:'News',          language:'Urdu',    logo:'', is_hd:0, stream_url:'https://live.express.pk/en/live.m3u8' },
  { id:6,  name:'BOL News',         country:'Pakistan', category:'News',          language:'Urdu',    logo:'', is_hd:0, stream_url:'https://boln.cdn.bol.com.pk/live/bolnews.m3u8' },
  { id:7,  name:'Aaj TV',           country:'Pakistan', category:'News',          language:'Urdu',    logo:'', is_hd:0, stream_url:'https://aajnews.cdn.bol.com.pk/live/aajnews.m3u8' },
  { id:8,  name:'Capital TV',       country:'Pakistan', category:'News',          language:'Urdu',    logo:'', is_hd:0, stream_url:'https://capitaltv.cdn.bol.com.pk/live/capitaltv.m3u8' },
  { id:9,  name:'Roze TV',          country:'Pakistan', category:'News',          language:'Urdu',    logo:'', is_hd:0, stream_url:'https://rozens.cdn.bol.com.pk/live/roze.m3u8' },
  { id:10, name:'92 News HD',       country:'Pakistan', category:'News',          language:'Urdu',    logo:'', is_hd:1, stream_url:'https://92news.cdn.bol.com.pk/live/92newshd.m3u8' },
  { id:11, name:'Naya Pakistan TV', country:'Pakistan', category:'News',          language:'Urdu',    logo:'', is_hd:0, stream_url:'https://np.cdn.bol.com.pk/live/nayapakistan.m3u8' },
  // Pakistan – Entertainment
  { id:12, name:'PTV Home',         country:'Pakistan', category:'Entertainment', language:'Urdu',    logo:'', is_hd:0, stream_url:'https://pvt-2.ptv.com.pk/live/ptv-home.m3u8' },
  { id:13, name:'Hum TV',           country:'Pakistan', category:'Entertainment', language:'Urdu',    logo:'', is_hd:0, stream_url:'https://humtv.cdn.bol.com.pk/live/humtv.m3u8' },
  { id:14, name:'ARY Digital',      country:'Pakistan', category:'Entertainment', language:'Urdu',    logo:'', is_hd:0, stream_url:'https://arydigital.live.geo.tv/live/ary-digital.m3u8' },
  { id:15, name:'Geo Entertainment',country:'Pakistan', category:'Entertainment', language:'Urdu',    logo:'', is_hd:0, stream_url:'https://geo-sd.geo.tv/live/geo-entertainment.m3u8' },
  { id:16, name:'TV One',           country:'Pakistan', category:'Entertainment', language:'Urdu',    logo:'', is_hd:0, stream_url:'https://tvone.cdn.bol.com.pk/live/tvone.m3u8' },
  { id:17, name:'A Plus',           country:'Pakistan', category:'Entertainment', language:'Urdu',    logo:'', is_hd:0, stream_url:'https://aplus.cdn.bol.com.pk/live/aplusentertainment.m3u8' },
  { id:18, name:'Hum Sitaray',      country:'Pakistan', category:'Entertainment', language:'Urdu',    logo:'', is_hd:0, stream_url:'https://humtv.cdn.bol.com.pk/live/humsitaray.m3u8' },
  { id:19, name:'ARY Zindagi',      country:'Pakistan', category:'Entertainment', language:'Urdu',    logo:'', is_hd:0, stream_url:'https://aryzindagi.cdn.bol.com.pk/live/aryzindagi.m3u8' },
  // Pakistan – Sports
  { id:20, name:'PTV Sports',       country:'Pakistan', category:'Sports',        language:'Urdu',    logo:'', is_hd:0, stream_url:'https://pvt-2.ptv.com.pk/live/ptv-sports.m3u8' },
  { id:21, name:'GEO Super',        country:'Pakistan', category:'Sports',        language:'Urdu',    logo:'', is_hd:0, stream_url:'https://geo-sd.geo.tv/live/geo-super.m3u8' },
  { id:22, name:'Ten Sports',       country:'Pakistan', category:'Sports',        language:'Urdu',    logo:'', is_hd:0, stream_url:'https://tensports.cdn.bol.com.pk/live/tensports.m3u8' },
  // Pakistan – Religious
  { id:23, name:'QTV',              country:'Pakistan', category:'Religious',     language:'Urdu',    logo:'', is_hd:0, stream_url:'https://qtv.cdn.bol.com.pk/live/qtv.m3u8' },
  { id:24, name:'Peace TV Urdu',    country:'Pakistan', category:'Religious',     language:'Urdu',    logo:'', is_hd:0, stream_url:'https://peacetv.cdn.bol.com.pk/live/peaceurdu.m3u8' },
  { id:25, name:'Madani Channel',   country:'Pakistan', category:'Religious',     language:'Urdu',    logo:'', is_hd:0, stream_url:'https://madanichannel.cdn.bol.com.pk/live/madanichannel.m3u8' },
  // Pakistan – Regional
  { id:26, name:'KTN Sindhi',       country:'Pakistan', category:'Entertainment', language:'Sindhi',  logo:'', is_hd:0, stream_url:'https://ktn.cdn.bol.com.pk/live/ktn.m3u8' },
  { id:27, name:'Khyber TV',        country:'Pakistan', category:'Entertainment', language:'Pashto',  logo:'', is_hd:0, stream_url:'https://khyber.cdn.bol.com.pk/live/khyber.m3u8' },
  { id:28, name:'PTV News',         country:'Pakistan', category:'News',          language:'Urdu',    logo:'', is_hd:0, stream_url:'https://pvt-2.ptv.com.pk/live/ptv-news.m3u8' },
  // International
  { id:29, name:'Al Jazeera Arabic',country:'Qatar',    category:'News',          language:'Arabic',  logo:'', is_hd:1, stream_url:'https://live-hls-web-aja.getaj.net/AJA/index.m3u8' },
  { id:30, name:'Al Jazeera English',country:'Qatar',   category:'News',          language:'English', logo:'', is_hd:1, stream_url:'https://live-hls-web-aje.getaj.net/AJE/index.m3u8' },
  { id:31, name:'Al Arabiya',       country:'Saudi Arabia',category:'News',       language:'Arabic',  logo:'', is_hd:0, stream_url:'https://alarabiyamobile.akamaized.net/hls/live/2003693/alarabiyamobile/index.m3u8' },
  { id:32, name:'Sky News',         country:'United Kingdom',category:'News',     language:'English', logo:'', is_hd:1, stream_url:'https://skynews-hand-skynewsapple-t.akamaized.net/hls/live/561321/skynewsapple/skynews/master.m3u8' },
  { id:33, name:'TRT World',        country:'Turkey',   category:'News',          language:'English', logo:'', is_hd:1, stream_url:'https://trtworldlive.cdn.bol.com.pk/live/trtworld.m3u8' },
  { id:34, name:'TRT Haber',        country:'Turkey',   category:'News',          language:'Turkish', logo:'', is_hd:0, stream_url:'https://tv-trt1.medya.trt.com.tr/master.m3u8' },
  { id:35, name:'Aaj Tak',          country:'India',    category:'News',          language:'Hindi',   logo:'', is_hd:1, stream_url:'https://hls.aajtaklive.in/aajtak/hls/live.m3u8' },
];

// ── IPTV-Org country codes ────────────────────────────────────────────────────
const IPTV_ORG_COUNTRIES = {
  'Pakistan':       'pk',
  'India':          'in',
  'Saudi Arabia':   'sa',
  'UAE':            'ae',
  'United Kingdom': 'gb',
  'USA':            'us',
  'Turkey':         'tr',
  'Qatar':          'qa',
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
