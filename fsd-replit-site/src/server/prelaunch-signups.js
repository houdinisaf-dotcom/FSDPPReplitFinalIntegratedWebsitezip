import { PRELAUNCH_CONSENT_COPY } from '../prelaunch-copy.js';

const INSERT_SIGNUP_SQL = `
  INSERT INTO public.fsd_prelaunch_signups (email, consent_text)
  VALUES ($1, $2)
  ON CONFLICT (email) DO NOTHING
  RETURNING id
`;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export async function savePrelaunchSignup(payload, query) {
  const email = typeof payload?.email === 'string'
    ? payload.email.trim().toLowerCase()
    : '';
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { status: 422, body: { ok: false, code: 'invalid_email' } };
  }
  if (payload?.consent !== true) {
    return { status: 422, body: { ok: false, code: 'consent_required' } };
  }

  try {
    const result = await query(INSERT_SIGNUP_SQL, [email, PRELAUNCH_CONSENT_COPY]);
    if (!result?.rowCount) {
      return { status: 409, body: { ok: false, code: 'already_signed_up' } };
    }
    return { status: 201, body: { ok: true, code: 'saved' } };
  } catch {
    return { status: 503, body: { ok: false, code: 'temporarily_unavailable' } };
  }
}

function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.end(JSON.stringify(body));
}

export function createPrelaunchSignupMiddleware({ query }) {
  if (typeof query !== 'function') {
    throw new TypeError('A database query function is required for pre-launch sign-ups.');
  }

  return (request, response, next) => {
    const pathname = (request.url || '/').split('?')[0];
    if (pathname !== '/api/signups') {
      next?.();
      return;
    }
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      sendJson(response, 405, { ok: false, code: 'method_not_allowed' });
      return;
    }
    if (!/^application\/json(?:\s*;|$)/iu.test(request.headers['content-type'] || '')) {
      sendJson(response, 415, { ok: false, code: 'json_required' });
      return;
    }

    const chunks = [];
    let byteLength = 0;
    let tooLarge = false;
    request.on('data', chunk => {
      byteLength += chunk.length;
      if (byteLength > 4096) {
        tooLarge = true;
        chunks.length = 0;
      } else if (!tooLarge) {
        chunks.push(chunk);
      }
    });
    request.on('end', async () => {
      if (tooLarge) {
        sendJson(response, 413, { ok: false, code: 'request_too_large' });
        return;
      }
      let payload;
      try {
        payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        sendJson(response, 400, { ok: false, code: 'invalid_json' });
        return;
      }
      const result = await savePrelaunchSignup(payload, query);
      sendJson(response, result.status, result.body);
    });
    request.on('error', () => {
      if (!response.headersSent) sendJson(response, 400, { ok: false, code: 'invalid_request' });
    });
  };
}
