import type { IncomingMessage, ServerResponse } from 'node:http';

/** Public API response. Keep the upload handler and provider adapters out of this module. */
export function disabledPhotoRoute(request: IncomingMessage, response: ServerResponse) {
  const isPost = request.method === 'POST';
  response.statusCode = isPost ? 503 : 405;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (!isPost) response.setHeader('Allow', 'POST');

  response.end(JSON.stringify(isPost ? {
    ok: false,
    code: 'not_configured',
    message: 'Paid AI analysis is disabled. Manual search and room planning are available.',
  } : {
    ok: false,
    code: 'unsupported',
    message: 'Only POST is supported.',
  }));
}
