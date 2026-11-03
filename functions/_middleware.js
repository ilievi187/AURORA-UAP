// Protect the static moderator interface at the origin as well as the API.
// Cloudflare Access must ALSO protect both routes in the Cloudflare dashboard.
import { accessIdentity } from './_lib/access.js';

const PRIVATE_PAGES = new Set(['/moderation', '/moderation/', '/moderation.html', '/news-editor', '/news-editor/', '/news-editor.html']);
const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "frame-ancestors 'none'"
};

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!PRIVATE_PAGES.has(url.pathname)) return context.next();

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { ...privateHeaders, Allow: 'GET, HEAD' } });
  }
  // Fail closed on previews, missing deployment bindings or missing Access identity.
  const newsEditor = url.pathname === '/news-editor' || url.pathname === '/news-editor/' || url.pathname === '/news-editor.html';
  const enabled = newsEditor
    ? env?.AURORA_NEWS_EDITOR_ENABLED === 'enabled' && env?.AURORA_MODERATION_ENABLED === 'enabled'
    : env?.AURORA_MODERATION_ENABLED === 'enabled';
  if (url.protocol !== 'https:' || url.hostname !== 'aurorauap.org' || !enabled || !env?.DB ||
      !await accessIdentity(request, env)) {
    return new Response('Forbidden', { status: 403, headers: privateHeaders });
  }
  const response = await context.next();
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(privateHeaders)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
