// api/cors-proxy.js
// Vercel Serverless Function acting as a CORS proxy for HLS streams.

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.exports = async (req, res) => {
  // Enable CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Origin, Accept, Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url query parameter' });
  }

  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    return res.status(403).json({ error: 'Invalid URL protocol' });
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*'
    };

    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const response = await fetch(targetUrl, { headers });

    // Forward content type and status
    const contentType = response.headers.get('Content-Type') || '';
    res.status(response.status);

    const passthroughHeaders = ['Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges'];
    passthroughHeaders.forEach(h => {
      if (response.headers.get(h)) {
        res.setHeader(h, response.headers.get(h));
      }
    });

    // If it's a playlist manifest, rewrite relative links
    if (
      contentType.includes('mpegurl') ||
      contentType.includes('x-mpegurl') ||
      targetUrl.includes('.m3u8')
    ) {
      let text = await response.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const proto = req.headers['x-forwarded-proto'] || 'https';
      const proxyBase = `${proto}://${host}/api/cors-proxy`;

      // Rewrite relative URLs to proxy URLs
      text = text.replace(/^(?!#)(.+\.(m3u8|m3u|ts|aac|mp4|fmp4|cmfv|cmfa))(\?.*)?$/gm, (match) => {
        const absoluteUrl = (match.startsWith('http://') || match.startsWith('https://')) 
          ? match 
          : baseUrl + match;
        return `${proxyBase}?url=${encodeURIComponent(absoluteUrl)}`;
      });

      return res.send(text);
    }

    // Otherwise, send the binary buffer directly
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return res.send(buffer);

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(502).json({ error: 'Proxy fetch failed', details: err.message });
  }
};
