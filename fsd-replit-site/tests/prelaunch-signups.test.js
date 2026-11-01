import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import {
  createPrelaunchSignupMiddleware,
  savePrelaunchSignup,
} from '../src/server/prelaunch-signups.js';

test('valid signup is normalized and stored with the consent wording', async () => {
  let saved;
  const result = await savePrelaunchSignup(
    { email: '  FSD.Member@Example.COM ', consent: true },
    async (sql, params) => {
      saved = { sql, params };
      return { rowCount: 1, rows: [{ id: 12 }] };
    },
  );

  assert.equal(result.status, 201);
  assert.deepEqual(result.body, { ok: true, code: 'saved' });
  assert.match(saved.sql, /ON CONFLICT \(email\) DO NOTHING/u);
  assert.equal(saved.params[0], 'fsd.member@example.com');
  assert.match(saved.params[1], /store my email address/u);
});

test('invalid email and missing consent are rejected before database access', async () => {
  let calls = 0;
  const query = async () => { calls += 1; return { rowCount: 1 }; };

  const invalidEmail = await savePrelaunchSignup({ email: 'not-an-email', consent: true }, query);
  const noConsent = await savePrelaunchSignup({ email: 'reader@example.test', consent: false }, query);

  assert.equal(invalidEmail.status, 422);
  assert.equal(invalidEmail.body.code, 'invalid_email');
  assert.equal(noConsent.status, 422);
  assert.equal(noConsent.body.code, 'consent_required');
  assert.equal(calls, 0);
});

test('a normalized duplicate is reported without updating the existing record', async () => {
  let params;
  const result = await savePrelaunchSignup(
    { email: 'Reader@Example.test', consent: true },
    async (_sql, values) => {
      params = values;
      return { rowCount: 0, rows: [] };
    },
  );

  assert.equal(result.status, 409);
  assert.equal(result.body.code, 'already_signed_up');
  assert.equal(params[0], 'reader@example.test');
});

test('database failures return a generic response without exposing details', async () => {
  const result = await savePrelaunchSignup(
    { email: 'reader@example.test', consent: true },
    async () => { throw new Error('private database details'); },
  );

  assert.equal(result.status, 503);
  assert.deepEqual(result.body, { ok: false, code: 'temporarily_unavailable' });
});

test('signup endpoint rejects unsupported content types and methods', async () => {
  const server = await new Promise(resolve => {
    const middleware = createPrelaunchSignupMiddleware({
      query: async () => ({ rowCount: 1, rows: [{ id: 1 }] }),
    });
    const instance = createServer((request, response) => middleware(request, response, () => {
      response.statusCode = 404;
      response.end();
    }));
    instance.listen(0, '127.0.0.1', () => resolve(instance));
  });

  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const unsupported = await fetch(`${origin}/api/signups`, { method: 'POST', body: 'x=y' });
    const wrongMethod = await fetch(`${origin}/api/signups`, { method: 'GET' });
    assert.equal(unsupported.status, 415);
    assert.equal(wrongMethod.status, 405);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
