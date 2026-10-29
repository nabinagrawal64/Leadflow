// HTTP-level tests of the app shell. No database is connected, which is also what we want to check:
// the API must answer honestly when MongoDB is down.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/leadflow-test'
process.env.CLIENT_ORIGIN = 'http://localhost:5173'
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123'
process.env.BCRYPT_ROUNDS = '4'

let server, base
before(async () => {
  const { createApp } = await import('../src/app.js')
  server = createApp().listen(0)
  base = `http://127.0.0.1:${server.address().port}/api/v1`
})
after(() => server.close())

test('GET /health reports the database is not connected (503)', async () => {
  const res = await fetch(`${base}/health`)
  const body = await res.json()
  assert.equal(res.status, 503)
  assert.equal(body.success, false)
  assert.equal(body.data.database, 'disconnected')
})

test('unknown routes return the standard JSON error', async () => {
  const res = await fetch(`${base}/nope`)
  const body = await res.json()
  assert.equal(res.status, 404)
  assert.deepEqual(Object.keys(body).sort(), ['errors', 'message', 'success'])
  assert.equal(body.success, false)
})

test('malformed JSON returns 400, not a stack trace', async () => {
  const res = await fetch(`${base}/health`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })
  const text = await res.text()
  assert.equal(res.status, 400)
  assert.ok(!text.includes('at '), 'response must not leak a stack trace')
})

test('CORS only ever grants the configured frontend origin', async () => {
  const ok = await fetch(`${base}/health`, { headers: { Origin: 'http://localhost:5173' } })
  assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:5173')
  // The cors package answers with the configured origin for every caller. A browser on another
  // site sees a header that does not match its own origin and blocks the response. What matters
  // is that it is never a wildcard and never echoes the caller's origin.
  const other = await fetch(`${base}/health`, { headers: { Origin: 'https://evil.example' } })
  const granted = other.headers.get('access-control-allow-origin')
  assert.notEqual(granted, '*')
  assert.notEqual(granted, 'https://evil.example')
})

test('security headers are set and the framework is not advertised', async () => {
  const res = await fetch(`${base}/health`)
  assert.equal(res.headers.get('x-powered-by'), null)
  assert.ok(res.headers.get('x-content-type-options'))
})
