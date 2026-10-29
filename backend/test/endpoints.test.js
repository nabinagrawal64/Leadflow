// Contract test: the 13 endpoints in section 5 of the assignment ("Minimum REST API"),
// in the same order as the PDF's table, plus its response conventions.
//
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npm test
//
// The database-backed parts are skipped when TEST_MONGODB_URI is not set. Like api.test.js,
// they use a throwaway database that is dropped afterwards.
import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

const BASE_URI = process.env.TEST_MONGODB_URI
const skip = BASE_URI ? false : 'set TEST_MONGODB_URI to run the database tests'
const DB = `leadflow_contract_${crypto.randomBytes(4).toString('hex')}`
const JWT_SECRET = 'contract-secret-contract-secret-123456'

process.env.JWT_SECRET = JWT_SECRET
process.env.BCRYPT_ROUNDS = '4'
process.env.CLIENT_ORIGIN = 'http://localhost:5173'
process.env.MONGODB_URI = BASE_URI ? `${BASE_URI.replace(/\/$/, '')}/${DB}` : 'mongodb://127.0.0.1:27017/unused'

// The PDF's table. `auth` = needs a bearer token.
const ENDPOINTS = [
  { method: 'GET', path: '/health', auth: false, purpose: 'Health check; do not expose secrets' },
  { method: 'POST', path: '/auth/register', auth: false, purpose: 'Validate input, hash password and create user' },
  { method: 'POST', path: '/auth/login', auth: false, purpose: 'Validate credentials and return token plus safe profile' },
  { method: 'GET', path: '/auth/me', auth: true, purpose: "Return authenticated user's safe profile" },
  { method: 'GET', path: '/leads', auth: true, purpose: 'List leads; support search and stage filter' },
  { method: 'POST', path: '/leads', auth: true, purpose: 'Create a lead' },
  { method: 'GET', path: '/leads/:id', auth: true, purpose: 'Get a lead after access check' },
  { method: 'PATCH', path: '/leads/:id', auth: true, purpose: 'Update permitted lead fields only' },
  { method: 'DELETE', path: '/leads/:id', auth: true, purpose: 'Delete lead and associated follow-ups' },
  { method: 'GET', path: '/activities', auth: true, purpose: 'List follow-ups; basic status filter' },
  { method: 'POST', path: '/activities', auth: true, purpose: 'Create a follow-up' },
  { method: 'PATCH', path: '/activities/:id', auth: true, purpose: 'Update permitted fields or mark completed' },
  { method: 'GET', path: '/dashboard/summary', auth: true, purpose: 'Return basic metrics calculated from saved records' },
]

let server, base, mongoose
before(async () => {
  if (skip) return
  mongoose = (await import('mongoose')).default
  const { connectDB } = await import('../src/config/db.js')
  const models = await import('../src/models/index.js')
  await connectDB()
  await Promise.all(Object.values(models).map((m) => m.init()))
  const { createApp } = await import('../src/app.js')
  server = createApp().listen(0)
  base = `http://127.0.0.1:${server.address().port}/api/v1`
})
after(async () => {
  if (skip) return
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
  server.close()
})

async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* not JSON */
  }
  return { status: res.status, body: json, text, headers: res.headers }
}

const ANY_ID = '64b7f0f2f2f2f2f2f2f2f2f2' // a valid ObjectId that matches nothing

describe('section 5: every endpoint exists under /api/v1', { skip }, () => {
  for (const e of ENDPOINTS) {
    test(`${e.method.padEnd(6)} ${e.path}`, async () => {
      const path = e.path.replace(':id', ANY_ID)
      const r = await call(e.method, path)
      // Whatever the outcome, it must be a handled route with a JSON body, not "route not found"
      assert.ok(r.body, 'response is JSON')
      assert.ok(!/Route not found/i.test(r.body.message ?? ''), `${e.method} ${e.path} is not routed`)
      if (e.auth) {
        assert.equal(r.status, 401, 'a protected endpoint rejects a request with no token')
        assert.equal(r.body.success, false)
      } else {
        assert.notEqual(r.status, 401, 'a public endpoint does not demand a token')
      }
    })
  }

  test('the table above lists exactly the 13 endpoints the PDF asks for', () => {
    assert.equal(ENDPOINTS.length, 13)
    assert.equal(new Set(ENDPOINTS.map((e) => `${e.method} ${e.path}`)).size, 13)
  })
})

describe('section 5: success status codes and response shape', { skip }, () => {
  test('a full walkthrough of all 13 endpoints returns the documented statuses', async () => {
    const seen = []
    const hit = async (method, path, expected, opts) => {
      const r = await call(method, path, opts)
      seen.push(`${method} ${path.replace(/[0-9a-f]{24}/g, ':id').replace(/\?.*/, '')} -> ${r.status}`)
      assert.equal(r.status, expected, `${method} ${path}: ${r.text.slice(0, 200)}`)
      assert.equal(r.body.success, true)
      assert.equal(typeof r.body.message, 'string')
      assert.ok('data' in r.body, 'success body has data')
      return r.body.data
    }

    const email = `contract_${crypto.randomBytes(3).toString('hex')}@test.com`
    const health = await hit('GET', '/health', 200)
    assert.equal(health.database, 'connected')

    const reg = await hit('POST', '/auth/register', 201, { body: { name: 'Contract', email, password: 'password123' } })
    const login = await hit('POST', '/auth/login', 200, { body: { email, password: 'password123' } })
    assert.ok(reg.token && login.token && login.user.email === email)
    const token = login.token

    assert.equal((await hit('GET', '/auth/me', 200, { token })).user.email, email)

    const lead = await hit('POST', '/leads', 201, { token, body: { name: 'Aarav', email: 'aarav@n.com' } })
    assert.equal((await hit('GET', '/leads', 200, { token })).length, 1)
    assert.equal((await hit('GET', `/leads/${lead._id}`, 200, { token }))._id, lead._id)
    assert.equal((await hit('PATCH', `/leads/${lead._id}`, 200, { token, body: { stage: 'Contacted' } })).stage, 'Contacted')

    const act = await hit('POST', '/activities', 201, { token, body: { leadId: lead._id, title: 'Call', dueAt: new Date(Date.now() + 864e5).toISOString() } })
    assert.equal((await hit('GET', '/activities?status=Pending', 200, { token })).length, 1)
    assert.equal((await hit('PATCH', `/activities/${act._id}`, 200, { token, body: { status: 'Completed' } })).status, 'Completed')

    const summary = await hit('GET', '/dashboard/summary', 200, { token })
    assert.equal(summary.totalLeads, 1)

    await hit('DELETE', `/leads/${lead._id}`, 200, { token })
    assert.equal((await hit('GET', '/activities', 200, { token })).length, 0, 'the lead’s follow-up was deleted with it')

    // every one of the 13 endpoints was exercised
    assert.equal(new Set(seen).size, 13, `exercised: ${[...new Set(seen)].join(' | ')}`)
  })

  test('GET /health exposes no secrets', async () => {
    const r = await call('GET', '/health')
    for (const secret of [JWT_SECRET, process.env.MONGODB_URI, BASE_URI]) assert.ok(!r.text.includes(secret), 'secret in health response')
    assert.ok(!/mongodb(\+srv)?:\/\//.test(r.text), 'connection string in health response')
  })
})

describe('section 5: error status codes', { skip }, () => {
  let token
  before(async () => {
    if (skip) return
    const r = await call('POST', '/auth/register', { body: { name: 'Err', email: `err_${crypto.randomBytes(3).toString('hex')}@test.com`, password: 'password123' } })
    token = r.body.data.token
  })

  test('400 invalid input, with the documented error shape', async () => {
    const r = await call('POST', '/leads', { token, body: {} })
    assert.equal(r.status, 400)
    assert.deepEqual(Object.keys(r.body).sort(), ['errors', 'message', 'success'])
    assert.equal(r.body.success, false)
    assert.equal(r.body.message, 'Validation failed')
    assert.ok(Array.isArray(r.body.errors) && r.body.errors.length > 0)
  })

  test('401 unauthenticated', async () => {
    assert.equal((await call('GET', '/leads')).status, 401)
  })

  test('404 not found', async () => {
    assert.equal((await call('GET', `/leads/${ANY_ID}`, { token })).status, 404)
    assert.equal((await call('GET', '/no-such-route')).status, 404)
  })

  test('409 duplicate conflict', async () => {
    const body = { name: 'Dup', email: `dup_${crypto.randomBytes(3).toString('hex')}@test.com`, password: 'password123' }
    assert.equal((await call('POST', '/auth/register', { body })).status, 201)
    assert.equal((await call('POST', '/auth/register', { body })).status, 409)
  })
})

// This one needs no database: it proves an unexpected failure becomes a generic 500.
describe('section 5: 500 unexpected server error', () => {
  test('an unexpected exception returns a generic 500 with no stack trace or internals', async () => {
    const express = (await import('express')).default
    const { errorHandler } = await import('../src/middleware/errorHandler.js')
    const app = express()
    app.get('/boom', () => {
      throw new Error('connection to db.internal:5432 failed, password=hunter2')
    })
    app.use(errorHandler)
    const srv = app.listen(0)
    try {
      const res = await fetch(`http://127.0.0.1:${srv.address().port}/boom`)
      const text = await res.text()
      const body = JSON.parse(text)
      assert.equal(res.status, 500)
      assert.deepEqual(body, { success: false, message: 'Something went wrong on our side', errors: [] })
      assert.ok(!/hunter2|db\.internal|\n\s+at /.test(text), 'internal detail leaked')
    } finally {
      srv.close()
    }
  })
})
