// Schema-level tests. They call validate() (which runs the model hooks) but never save,
// so no database connection is needed.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { User, Lead, Activity } from '../src/models/index.js'

const id = () => new mongoose.Types.ObjectId()
// Resolves to the list of invalid field names ([] when the document is valid)
const fieldsWithErrors = async (doc) => {
  try {
    await doc.validate()
    return []
  } catch (err) {
    return Object.keys(err.errors ?? {})
  }
}

test('User: requires name, email and passwordHash', async () => {
  const errs = await fieldsWithErrors(new User({}))
  assert.deepEqual(errs.sort(), ['email', 'name', 'passwordHash'])
})

test('User: trims and lowercases email, defaults role to admin', async () => {
  const u = new User({ name: ' Ada ', email: '  Ada@Example.COM ', passwordHash: 'x' })
  assert.equal(u.email, 'ada@example.com')
  assert.equal(u.name, 'Ada')
  assert.equal(u.role, 'admin')
  assert.deepEqual(await fieldsWithErrors(u), [])
})

test('User: rejects invalid email', async () => {
  assert.deepEqual(await fieldsWithErrors(new User({ name: 'A', email: 'nope', passwordHash: 'x' })), ['email'])
})

test('User: passwordHash is never serialised', async () => {
  const u = new User({ name: 'A', email: 'a@b.co', passwordHash: 'secret-hash' })
  assert.equal('passwordHash' in u.toJSON(), false)
  assert.equal(JSON.stringify(u).includes('secret-hash'), false)
})

test('User: email has a unique index', async () => {
  const idx = User.schema.indexes().find(([spec]) => spec.email === 1)
  assert.ok(idx, 'email index missing')
  assert.equal(idx[1].unique, true)
})

test('Lead: name is required', async () => {
  assert.ok((await fieldsWithErrors(new Lead({ email: 'a@b.co', createdBy: id() }))).includes('name'))
})

test('Lead: needs at least one of email or phone', async () => {
  const errs = await fieldsWithErrors(new Lead({ name: 'Ann', createdBy: id() }))
  assert.ok(errs.includes('email') && errs.includes('phone'))
})

test('Lead: email alone, or phone alone, is enough', async () => {
  assert.deepEqual(await fieldsWithErrors(new Lead({ name: 'A', email: 'a@b.co', createdBy: id() })), [])
  assert.deepEqual(await fieldsWithErrors(new Lead({ name: 'A', phone: '98765', createdBy: id() })), [])
})

test('Lead: rejects an invalid email when supplied', async () => {
  assert.ok((await fieldsWithErrors(new Lead({ name: 'A', email: 'bad', createdBy: id() }))).includes('email'))
})

test('Lead: rejects negative budget, allows zero and missing', async () => {
  assert.ok((await fieldsWithErrors(new Lead({ name: 'A', email: 'a@b.co', budget: -1, createdBy: id() }))).includes('budget'))
  assert.deepEqual(await fieldsWithErrors(new Lead({ name: 'A', email: 'a@b.co', budget: 0, createdBy: id() })), [])
  assert.deepEqual(await fieldsWithErrors(new Lead({ name: 'A', email: 'a@b.co', createdBy: id() })), [])
})

test('Lead: stage defaults to New and only allows the six stages', async () => {
  assert.equal(new Lead({ name: 'A', email: 'a@b.co', createdBy: id() }).stage, 'New')
  assert.ok((await fieldsWithErrors(new Lead({ name: 'A', email: 'a@b.co', stage: 'Maybe', createdBy: id() }))).includes('stage'))
  for (const stage of ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost']) {
    assert.deepEqual(await fieldsWithErrors(new Lead({ name: 'A', email: 'a@b.co', stage, createdBy: id() })), [])
  }
})

test('Lead: source and serviceInterest must be listed values', async () => {
  const errs = await fieldsWithErrors(new Lead({ name: 'A', email: 'a@b.co', source: 'Pigeon', serviceInterest: 'Magic', createdBy: id() }))
  assert.deepEqual(errs.sort(), ['serviceInterest', 'source'])
})

test('Lead: createdBy is required and immutable', async () => {
  assert.ok((await fieldsWithErrors(new Lead({ name: 'A', email: 'a@b.co' }))).includes('createdBy'))
  assert.equal(Lead.schema.path('createdBy').options.immutable, true)
})

test('Activity: requires leadId, title, dueAt and createdBy', async () => {
  assert.deepEqual((await fieldsWithErrors(new Activity({}))).sort(), ['createdBy', 'dueAt', 'leadId', 'title'])
})

test('Activity: defaults to a pending Task', async () => {
  const a = new Activity({ leadId: id(), title: 'Call', dueAt: new Date(), createdBy: id() })
  assert.equal(a.type, 'Task')
  assert.equal(a.status, 'Pending')
  assert.deepEqual(await fieldsWithErrors(a), [])
})

test('Activity: rejects unknown type, status and an invalid date', async () => {
  const errs = await fieldsWithErrors(new Activity({ leadId: id(), title: 'x', type: 'Fax', status: 'Done', dueAt: 'not-a-date', createdBy: id() }))
  assert.deepEqual(errs.sort(), ['dueAt', 'status', 'type'])
})

test('Activity: completedAt is set by the server when completed', async () => {
  const a = new Activity({ leadId: id(), title: 'x', dueAt: new Date(), status: 'Completed', createdBy: id() })
  await a.validate()
  assert.ok(a.completedAt instanceof Date)
})

test('Activity: completedAt is cleared when set back to pending', async () => {
  const a = new Activity({ leadId: id(), title: 'x', dueAt: new Date(), status: 'Completed', createdBy: id() })
  await a.validate()
  a.status = 'Pending'
  await a.validate()
  assert.equal(a.completedAt, undefined)
})
