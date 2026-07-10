/**
 * PAKTV Live - CORS Proxy Worker (Cloudflare Worker)
 * 
 * Proxies HLS stream manifest (.m3u8) and segment (.ts) requests,
 * adding CORS headers so browsers can play streams from any origin.
 *
 * Deploy at: https://dash.cloudflare.com/workers
 * Usage: https://your-worker.workers.dev/?url=http://stream.example.com/live.m3u8
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Origin, Accept, Content-Type',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    let targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing ?url= parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    // Security: only allow stream URLs (http/https)
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return new Response(
        JSON.stringify({ error: 'Only http/https URLs are allowed' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    try {
      // Forward the request to the actual stream server
      const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PAKTVProxy/1.0)',
          'Accept': '*/*',
          ...(request.headers.get('Range') ? { 'Range': request.headers.get('Range') } : {}),
        },
      });

      const response = await fetch(proxyRequest);

      // For M3U8 playlists, rewrite internal URLs to also go through the proxy
      const contentType = response.headers.get('Content-Type') || '';
      if (
        contentType.includes('mpegurl') ||
        contentType.includes('x-mpegurl') ||
        targetUrl.endsWith('.m3u8') ||
        targetUrl.endsWith('.m3u')
      ) {
        let body = await response.text();
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
        const workerBase = url.origin + url.pathname;

        // Rewrite relative segment and playlist URLs to go through this proxy
        body = body.replace(/^(?!#)(.+\.(m3u8|m3u|ts|aac|mp4|fmp4|cmfv|cmfa))(\?.*)?$/gm, (match) => {
          if (match.startsWith('http://') || match.startsWith('https://')) {
            return `${workerBase}?url=${encodeURIComponent(match)}`;
          }
          return `${workerBase}?url=${encodeURIComponent(baseUrl + match)}`;
        });

        return new Response(body, {
          status: response.status,
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Cache-Control': 'no-cache',
            ...CORS_HEADERS,
          },
        });
      }

      // For binary segments (.ts, .aac, etc.) stream through directly
      const responseHeaders = new Headers(CORS_HEADERS);
      const passthroughHeaders = ['Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges'];
      for (const h of passthroughHeaders) {
        if (response.headers.get(h)) responseHeaders.set(h, response.headers.get(h));
      }

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Proxy fetch failed', detail: err.message }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }
  },
};
