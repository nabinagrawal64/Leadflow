// End-to-end API tests against a real MongoDB-compatible server.
//
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npm test
//
// Never point this at a database you care about: it creates a throwaway database
// (leadflow_test_<random>) and drops it afterwards. Skipped when TEST_MONGODB_URI is not set.
// The cases follow the assignment's section 9 checklist.
import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

const BASE_URI = process.env.TEST_MONGODB_URI
const skip = BASE_URI ? false : 'set TEST_MONGODB_URI to run the database tests'

let server, base, mongoose, models
const DB = `leadflow_test_${crypto.randomBytes(4).toString('hex')}`

before(async () => {
  if (skip) return
  process.env.MONGODB_URI = `${BASE_URI.replace(/\/$/, '')}/${DB}`
  process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123'
  process.env.BCRYPT_ROUNDS = '4' // fast hashing for tests only
  process.env.CLIENT_ORIGIN = 'http://localhost:5173'
  mongoose = (await import('mongoose')).default
  const { connectDB } = await import('../src/config/db.js')
  models = await import('../src/models/index.js')
  await connectDB()
  await Promise.all(Object.values(models).map((m) => m.init())) // build indexes (unique email)
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

// ---- helpers -------------------------------------------------------------------------------
async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await res.json()
  return { status: res.status, body: json }
}
const post = (p, o) => call('POST', p, o)
const get = (p, o) => call('GET', p, o)
const patch = (p, o) => call('PATCH', p, o)
const del = (p, o) => call('DELETE', p, o)

let counter = 0
async function newUser(name = 'Test User') {
  const email = `user${++counter}_${crypto.randomBytes(3).toString('hex')}@test.com`
  const r = await post('/auth/register', { body: { name, email, password: 'password123' } })
  return { token: r.body.data.token, user: r.body.data.user, email, password: 'password123' }
}
const lead = (token, extra = {}) => post('/leads', { token, body: { name: 'Aarav Sharma', email: 'aarav@northwind.com', ...extra } })
const inFuture = (days = 1) => new Date(Date.now() + days * 864e5).toISOString()
const inPast = (days = 1) => new Date(Date.now() - days * 864e5).toISOString()
const fields = (r) => (r.body.errors || []).map((e) => e.field).sort()

// ---- Authentication --------------------------------------------------------------------------
describe('authentication', { skip }, () => {
  test('register creates a user and returns a token plus a safe profile', async () => {
    const r = await post('/auth/register', { body: { name: 'Ann', email: ' ANN@Example.com ', password: 'password123' } })
    assert.equal(r.status, 201)
    assert.equal(r.body.success, true)
    assert.ok(r.body.data.token)
    assert.equal(r.body.data.user.email, 'ann@example.com') // trimmed + lowercased
    assert.equal(r.body.data.user.role, 'admin')
    assert.equal('passwordHash' in r.body.data.user, false)
    assert.equal('password' in r.body.data.user, false)
  })

  test('the stored password is a bcrypt hash, never the plain text', async () => {
    const { email } = await newUser()
    const doc = await models.User.findOne({ email }).select('+passwordHash')
    assert.match(doc.passwordHash, /^\$2[aby]\$/)
    assert.notEqual(doc.passwordHash, 'password123')
  })

  test('duplicate email is rejected with 409', async () => {
    const { email } = await newUser()
    const r = await post('/auth/register', { body: { name: 'Again', email: email.toUpperCase(), password: 'password123' } })
    assert.equal(r.status, 409)
    assert.deepEqual(fields(r), ['email'])
  })

  test('the database itself enforces unique email', async () => {
    const { email } = await newUser()
    await assert.rejects(models.User.create({ name: 'Dup', email, passwordHash: 'x' }), (e) => e.code === 11000)
  })

  test('register validates name, email and password', async () => {
    const r = await post('/auth/register', { body: { name: '', email: 'nope', password: 'short' } })
    assert.equal(r.status, 400)
    assert.deepEqual(fields(r), ['email', 'name', 'password'])
    assert.equal((await post('/auth/register', { body: {} })).status, 400)
  })

  test('register rejects fields it does not accept (e.g. role)', async () => {
    const r = await post('/auth/register', { body: { name: 'Eve', email: 'eve@test.com', password: 'password123', role: 'owner' } })
    assert.equal(r.status, 400)
    assert.deepEqual(fields(r), ['role'])
  })

  test('login works with valid credentials', async () => {
    const u = await newUser()
    const r = await post('/auth/login', { body: { email: u.email, password: u.password } })
    assert.equal(r.status, 200)
    assert.ok(r.body.data.token)
    assert.equal('passwordHash' in r.body.data.user, false)
  })

  test('login rejects a wrong password and an unknown email with the same message', async () => {
    const u = await newUser()
    const wrong = await post('/auth/login', { body: { email: u.email, password: 'wrong-password' } })
    const unknown = await post('/auth/login', { body: { email: 'ghost@test.com', password: 'password123' } })
    assert.equal(wrong.status, 401)
    assert.equal(unknown.status, 401)
    assert.equal(wrong.body.message, unknown.body.message)
  })

  test('login rejects missing credentials', async () => {
    assert.equal((await post('/auth/login', { body: { email: 'a@b.co' } })).status, 400)
  })

  test('GET /auth/me returns the signed-in user', async () => {
    const u = await newUser('Maya')
    const r = await get('/auth/me', { token: u.token })
    assert.equal(r.status, 200)
    assert.equal(r.body.data.user.name, 'Maya')
    assert.equal('passwordHash' in r.body.data.user, false)
  })

  test('protected routes reject a missing, malformed or forged token (401)', async () => {
    for (const path of ['/auth/me', '/leads', '/activities', '/dashboard/summary']) {
      assert.equal((await get(path)).status, 401, `${path} without a token`)
      assert.equal((await get(path, { token: 'not.a.jwt' })).status, 401, `${path} with garbage`)
    }
    const jwt = (await import('jsonwebtoken')).default
    const u = await newUser()
    const forged = jwt.sign({}, 'a-different-secret-a-different-secret-1', { subject: u.user._id, expiresIn: '1h' })
    assert.equal((await get('/auth/me', { token: forged })).status, 401)
    const none = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: u.user._id })).toString('base64url')}.`
    assert.equal((await get('/auth/me', { token: none })).status, 401, 'alg:none token')
  })

  test('an expired token is rejected', async () => {
    const jwt = (await import('jsonwebtoken')).default
    const u = await newUser()
    const expired = jwt.sign({}, process.env.JWT_SECRET, { subject: u.user._id, expiresIn: -10 })
    const r = await get('/auth/me', { token: expired })
    assert.equal(r.status, 401)
    assert.match(r.body.message, /expired/i)
  })
})

// ---- Leads --------------------------------------------------------------------------------------
describe('leads', { skip }, () => {
  test('create, view, edit and delete a lead', async () => {
    const { token } = await newUser()
    const created = await lead(token, { company: 'Northwind', budget: 85000, source: 'Referral', serviceInterest: 'SEO' })
    assert.equal(created.status, 201)
    const l = created.body.data
    assert.equal(l.stage, 'New') // default
    assert.equal(l.budget, 85000)

    assert.equal((await get(`/leads/${l._id}`, { token })).body.data.name, 'Aarav Sharma')

    const edited = await patch(`/leads/${l._id}`, { token, body: { company: 'Northwind Global', stage: 'Qualified' } })
    assert.equal(edited.status, 200)
    assert.equal(edited.body.data.company, 'Northwind Global')
    assert.equal(edited.body.data.stage, 'Qualified')
    // persisted, not just echoed
    assert.equal((await get(`/leads/${l._id}`, { token })).body.data.stage, 'Qualified')

    assert.equal((await del(`/leads/${l._id}`, { token })).status, 200)
    assert.equal((await get(`/leads/${l._id}`, { token })).status, 404)
  })

  test('createdBy is taken from the token, and cannot be supplied', async () => {
    const a = await newUser()
    const b = await newUser()
    const ok = await lead(a.token)
    assert.equal(ok.body.data.createdBy, a.user._id)
    const r = await lead(a.token, { createdBy: b.user._id })
    assert.equal(r.status, 400)
    assert.deepEqual(fields(r), ['createdBy'])
  })

  test('rejects attempts to set _id, timestamps or unknown fields', async () => {
    const { token } = await newUser()
    for (const bad of [{ _id: '64b7f0f2f2f2f2f2f2f2f2f2' }, { createdAt: '2020-01-01' }, { updatedAt: '2020-01-01' }, { isAdmin: true }]) {
      const r = await lead(token, bad)
      assert.equal(r.status, 400, JSON.stringify(bad))
    }
  })

  test('rejects a missing name, missing email+phone, invalid email and negative budget', async () => {
    const { token } = await newUser()
    const noName = await post('/leads', { token, body: { email: 'a@b.co' } })
    assert.equal(noName.status, 400)
    assert.ok(fields(noName).includes('name'))

    const noContact = await post('/leads', { token, body: { name: 'No Contact' } })
    assert.equal(noContact.status, 400)
    assert.deepEqual(fields(noContact), ['email', 'phone'])

    const badEmail = await lead(token, { email: 'not-an-email' })
    assert.equal(badEmail.status, 400)
    assert.deepEqual(fields(badEmail), ['email'])

    const negative = await lead(token, { budget: -5 })
    assert.equal(negative.status, 400)
    assert.deepEqual(fields(negative), ['budget'])

    assert.equal((await lead(token, { budget: '100' })).status, 400, 'budget must be a number')
    assert.equal((await lead(token, { stage: 'Maybe' })).status, 400)
    assert.equal((await lead(token, { source: 'Pigeon' })).status, 400)
  })

  test('a phone number alone is enough', async () => {
    const { token } = await newUser()
    assert.equal((await post('/leads', { token, body: { name: 'Phone Only', phone: '+91 98765 43210' } })).status, 201)
  })

  test('an edit cannot leave a lead with neither email nor phone', async () => {
    const { token } = await newUser()
    const l = (await lead(token)).body.data // has email only
    const r = await patch(`/leads/${l._id}`, { token, body: { email: null } })
    assert.equal(r.status, 400)
    assert.deepEqual(fields(r), ['email', 'phone'])
    assert.equal((await get(`/leads/${l._id}`, { token })).body.data.email, 'aarav@northwind.com', 'unchanged')
    // clearing email is fine once a phone exists
    assert.equal((await patch(`/leads/${l._id}`, { token, body: { phone: '12345', email: null } })).status, 200)
  })

  test('PATCH allows only permitted fields and needs at least one', async () => {
    const { token } = await newUser()
    const l = (await lead(token)).body.data
    assert.equal((await patch(`/leads/${l._id}`, { token, body: { createdBy: l._id } })).status, 400)
    assert.equal((await patch(`/leads/${l._id}`, { token, body: {} })).status, 400)
    assert.equal((await patch(`/leads/${l._id}`, { token, body: { budget: -1 } })).status, 400)
  })

  test('search matches name or company (case-insensitive) and treats input as text, not a regex', async () => {
    const { token } = await newUser()
    await lead(token, { name: 'Priya Nair', company: 'Lumen Studio', email: 'p@l.co' })
    await lead(token, { name: 'Karan Mehta', company: 'Orbit Labs', email: 'k@o.co' })
    const byName = await get('/leads?search=priya', { token })
    assert.deepEqual(byName.body.data.map((x) => x.name), ['Priya Nair'])
    const byCompany = await get('/leads?search=ORBIT', { token })
    assert.deepEqual(byCompany.body.data.map((x) => x.name), ['Karan Mehta'])
    assert.equal((await get('/leads?search=.*', { token })).body.data.length, 0, 'regex characters are literal')
    assert.equal((await get('/leads?search=zzzz', { token })).body.data.length, 0)
  })

  test('filters by stage and rejects an unknown stage', async () => {
    const { token } = await newUser()
    await lead(token, { name: 'One', stage: 'Won' })
    await lead(token, { name: 'Two', stage: 'Lost' })
    await lead(token, { name: 'Three' })
    assert.deepEqual((await get('/leads?stage=Won', { token })).body.data.map((x) => x.name), ['One'])
    assert.equal((await get('/leads?stage=Nope', { token })).status, 400)
    assert.equal((await get('/leads', { token })).body.data.length, 3)
  })

  test('query-operator injection is rejected', async () => {
    const { token } = await newUser()
    await lead(token)
    const r = await get('/leads?stage[$ne]=Won', { token })
    assert.ok([200, 400].includes(r.status))
    if (r.status === 200) assert.equal(r.body.data.length, 1) // treated as a plain, unknown key
  })

  test('validates ObjectIds in the URL', async () => {
    const { token } = await newUser()
    assert.equal((await get('/leads/not-an-id', { token })).status, 400)
    assert.equal((await get('/leads/64b7f0f2f2f2f2f2f2f2f2f2', { token })).status, 404)
    assert.equal((await del('/leads/xyz', { token })).status, 400)
  })

  test('a user cannot see, edit or delete another user’s lead', async () => {
    const a = await newUser()
    const b = await newUser()
    const l = (await lead(a.token)).body.data
    assert.equal((await get(`/leads/${l._id}`, { token: b.token })).status, 404)
    assert.equal((await patch(`/leads/${l._id}`, { token: b.token, body: { stage: 'Won' } })).status, 404)
    assert.equal((await del(`/leads/${l._id}`, { token: b.token })).status, 404)
    assert.equal((await get('/leads', { token: b.token })).body.data.length, 0)
    assert.equal((await get(`/leads/${l._id}`, { token: a.token })).body.data.stage, 'New', 'owner’s lead untouched')
  })
})

// ---- Follow-ups ---------------------------------------------------------------------------------
describe('follow-ups', { skip }, () => {
  const make = (token, leadId, extra = {}) =>
    post('/activities', { token, body: { leadId, title: 'Intro call', type: 'Call', dueAt: inFuture(), ...extra } })

  test('create a follow-up for a valid lead and see it populated with the lead', async () => {
    const { token } = await newUser()
    const l = (await lead(token, { company: 'Northwind' })).body.data
    const r = await make(token, l._id)
    assert.equal(r.status, 201)
    assert.equal(r.body.data.status, 'Pending')
    assert.equal(r.body.data.leadId.name, 'Aarav Sharma')
    assert.equal(r.body.data.leadId.company, 'Northwind')

    const list = await get('/activities', { token })
    assert.equal(list.body.data.length, 1)
    assert.equal(list.body.data[0].leadId._id, l._id)
  })

  test('one lead can have several follow-ups, listed by due date', async () => {
    const { token } = await newUser()
    const l = (await lead(token)).body.data
    await make(token, l._id, { title: 'Later', dueAt: inFuture(5) })
    await make(token, l._id, { title: 'Sooner', dueAt: inFuture(1) })
    const list = (await get(`/activities?leadId=${l._id}`, { token })).body.data
    assert.deepEqual(list.map((a) => a.title), ['Sooner', 'Later'])
  })

  test('rejects a nonexistent or invalid lead reference', async () => {
    const { token } = await newUser()
    const missing = await make(token, '64b7f0f2f2f2f2f2f2f2f2f2')
    assert.equal(missing.status, 404)
    assert.deepEqual(fields(missing), ['leadId'])
    assert.equal((await make(token, 'nonsense')).status, 400)
  })

  test('cannot create a follow-up on another user’s lead', async () => {
    const a = await newUser()
    const b = await newUser()
    const l = (await lead(a.token)).body.data
    const r = await make(b.token, l._id)
    assert.equal(r.status, 404)
    assert.equal((await get('/activities', { token: a.token })).body.data.length, 0)
  })

  test('validates title, due date, type and unknown fields', async () => {
    const { token } = await newUser()
    const l = (await lead(token)).body.data
    assert.deepEqual(fields(await make(token, l._id, { title: '' })), ['title'])
    assert.deepEqual(fields(await make(token, l._id, { dueAt: 'tomorrow' })), ['dueAt'])
    assert.deepEqual(fields(await make(token, l._id, { dueAt: undefined })), ['dueAt'])
    assert.equal((await make(token, l._id, { type: 'Fax' })).status, 400)
    assert.equal((await make(token, l._id, { createdBy: l._id })).status, 400)
    assert.equal((await make(token, l._id, { status: 'Completed' })).status, 400, 'status is not set on create')
  })

  test('mark complete records the completion time on the server', async () => {
    const { token } = await newUser()
    const l = (await lead(token)).body.data
    const a = (await make(token, l._id)).body.data
    assert.equal(a.completedAt, undefined)
    const before = Date.now()
    const r = await patch(`/activities/${a._id}`, { token, body: { status: 'Completed' } })
    assert.equal(r.status, 200)
    assert.equal(r.body.data.status, 'Completed')
    const done = new Date(r.body.data.completedAt).getTime()
    assert.ok(done >= before - 1000 && done <= Date.now() + 1000)
    // a client-supplied completion time is rejected
    assert.equal((await patch(`/activities/${a._id}`, { token, body: { completedAt: '2020-01-01T00:00:00Z' } })).status, 400)
  })

  test('status filter works, and a follow-up cannot be moved to another lead', async () => {
    const { token } = await newUser()
    const l1 = (await lead(token)).body.data
    const l2 = (await lead(token, { name: 'Second', email: 's@s.co' })).body.data
    const a = (await make(token, l1._id)).body.data
    await make(token, l1._id, { title: 'Other' })
    await patch(`/activities/${a._id}`, { token, body: { status: 'Completed' } })
    assert.equal((await get('/activities?status=Pending', { token })).body.data.length, 1)
    assert.equal((await get('/activities?status=Completed', { token })).body.data.length, 1)
    assert.equal((await get('/activities?status=Nope', { token })).status, 400)
    assert.equal((await patch(`/activities/${a._id}`, { token, body: { leadId: l2._id } })).status, 400)
  })

  test('another user cannot complete my follow-up', async () => {
    const a = await newUser()
    const b = await newUser()
    const l = (await lead(a.token)).body.data
    const act = (await make(a.token, l._id)).body.data
    assert.equal((await patch(`/activities/${act._id}`, { token: b.token, body: { status: 'Completed' } })).status, 404)
    assert.equal((await get('/activities?status=Pending', { token: a.token })).body.data.length, 1)
  })

  test('deleting a lead deletes its follow-ups, and only its own', async () => {
    const { token, user } = await newUser()
    const l1 = (await lead(token)).body.data
    const l2 = (await lead(token, { name: 'Keep', email: 'k@k.co' })).body.data
    await make(token, l1._id)
    await make(token, l1._id, { title: 'Second' })
    await make(token, l2._id, { title: 'Survivor' })
    assert.equal((await del(`/leads/${l1._id}`, { token })).status, 200)
    const remaining = await models.Activity.find({ createdBy: user._id })
    assert.deepEqual(remaining.map((a) => a.title), ['Survivor'])
  })
})

// ---- Dashboard ----------------------------------------------------------------------------------
describe('dashboard', { skip }, () => {
  test('a new user sees zeros, not placeholders', async () => {
    const { token } = await newUser()
    const r = await get('/dashboard/summary', { token })
    assert.equal(r.status, 200)
    assert.deepEqual(r.body.data, { totalLeads: 0, activeLeads: 0, wonLeads: 0, pendingFollowUps: 0, overdueFollowUps: 0 })
  })

  test('metrics are calculated from the saved records', async () => {
    const { token } = await newUser()
    // 5 leads: New, Contacted, Qualified (active), Won, Lost (closed)
    const stages = ['New', 'Contacted', 'Qualified', 'Won', 'Lost']
    const leads = []
    for (const [i, stage] of stages.entries()) leads.push((await lead(token, { name: `Lead ${i}`, email: `l${i}@t.co`, stage })).body.data)

    const mk = (leadId, dueAt) => post('/activities', { token, body: { leadId, title: 'x', dueAt } })
    await mk(leads[0]._id, inPast(2)) // pending + overdue
    await mk(leads[0]._id, inPast(1)) // pending + overdue
    await mk(leads[1]._id, inFuture(2)) // pending, not overdue
    const done = (await mk(leads[2]._id, inPast(3))).body.data // will be completed: never overdue
    await patch(`/activities/${done._id}`, { token, body: { status: 'Completed' } })

    const s = (await get('/dashboard/summary', { token })).body.data
    assert.deepEqual(s, { totalLeads: 5, activeLeads: 3, wonLeads: 1, pendingFollowUps: 3, overdueFollowUps: 2 })

    // moving a lead to Won changes the numbers; deleting a lead removes its follow-ups from them
    await patch(`/leads/${leads[0]._id}`, { token, body: { stage: 'Won' } })
    await del(`/leads/${leads[0]._id}`, { token }) // removes 2 overdue follow-ups
    const s2 = (await get('/dashboard/summary', { token })).body.data
    assert.deepEqual(s2, { totalLeads: 4, activeLeads: 2, wonLeads: 1, pendingFollowUps: 1, overdueFollowUps: 0 })
  })

  test('counts only the signed-in user’s records', async () => {
    const a = await newUser()
    const b = await newUser()
    await lead(a.token)
    await lead(a.token, { name: 'Two', email: 't@t.co' })
    assert.equal((await get('/dashboard/summary', { token: b.token })).body.data.totalLeads, 0)
    assert.equal((await get('/dashboard/summary', { token: a.token })).body.data.totalLeads, 2)
  })
})

// ---- Responses and errors ---------------------------------------------------------------------------
describe('response conventions', { skip }, () => {
  test('success and error bodies use the documented shapes', async () => {
    const { token } = await newUser()
    const ok = await lead(token)
    assert.deepEqual(Object.keys(ok.body).sort(), ['data', 'message', 'success'])
    const bad = await post('/leads', { token, body: {} })
    assert.deepEqual(Object.keys(bad.body).sort(), ['errors', 'message', 'success'])
    assert.equal(bad.body.success, false)
    assert.ok(Array.isArray(bad.body.errors))
  })

  test('no response ever contains a passwordHash or a stack trace', async () => {
    const u = await newUser()
    const texts = []
    for (const [m, p, o] of [['GET', '/auth/me', { token: u.token }], ['GET', '/leads/xyz', { token: u.token }], ['POST', '/auth/login', { body: { email: u.email, password: 'bad-password' } }]]) {
      texts.push(JSON.stringify((await call(m, p, o)).body))
    }
    for (const t of texts) {
      assert.ok(!/passwordHash|\$2[aby]\$/.test(t), 'hash leaked')
      assert.ok(!/\n\s+at |node_modules/.test(t), 'stack leaked')
    }
  })

  test('the health check reports a connected database', async () => {
    const r = await get('/health')
    assert.equal(r.status, 200)
    assert.equal(r.body.data.database, 'connected')
  })
})
