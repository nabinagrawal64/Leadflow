// Loads demo data so you can try the app without typing anything in.
//
//   npm run seed
//
// It creates (or resets) ONE demo account and gives it the leads and follow-ups from
// dummy-data.json. Other users' data is never touched. Follow-up dates are relative to
// today ("dueInDays"), so some are always overdue and some are always upcoming.
import { readFile } from 'node:fs/promises'
import bcrypt from 'bcryptjs'
import { env } from '../src/config/env.js'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { Activity, Lead, User } from '../src/models/index.js'

if (env.isProduction) {
  console.error('Refusing to seed demo data when NODE_ENV=production.')
  process.exit(1)
}

const data = JSON.parse(await readFile(new URL('./dummy-data.json', import.meta.url), 'utf8'))

const dueDate = (days, hour) => {
  const d = new Date(Date.now() + days * 864e5)
  d.setHours(hour, 0, 0, 0) // local time of the machine running the seed
  return d
}

try {
  await connectDB()
  const { name, email, password } = data.demoUser
  const passwordHash = await bcrypt.hash(password, env.bcryptRounds)

  // Reuse the demo account if it exists; clear only its own leads and follow-ups first
  let user = await User.findOne({ email })
  if (user) {
    await Activity.deleteMany({ createdBy: user._id })
    await Lead.deleteMany({ createdBy: user._id })
    user.name = name
    user.passwordHash = passwordHash
    await user.save()
  } else {
    user = await User.create({ name, email, passwordHash })
  }

  const byKey = {}
  for (const { key, ...fields } of data.leads) {
    byKey[key] = await Lead.create({ ...fields, createdBy: user._id })
  }

  let completed = 0
  for (const a of data.activities) {
    const lead = byKey[a.lead]
    if (!lead) throw new Error(`dummy-data.json: follow-up "${a.title}" refers to unknown lead "${a.lead}"`)
    const done = a.status === 'Completed'
    await Activity.create({
      leadId: lead._id,
      createdBy: user._id,
      title: a.title,
      type: a.type,
      dueAt: dueDate(a.dueInDays, a.hour),
      status: done ? 'Completed' : 'Pending',
      ...(done && { completedAt: dueDate(a.dueInDays, a.hour + 1) }),
    })
    if (done) completed++
  }

  console.log(`Seeded ${data.leads.length} leads and ${data.activities.length} follow-ups (${completed} completed).`)
  console.log(`\nLog in with:\n  email:    ${email}\n  password: ${password}`)
} catch (err) {
  console.error('Seed failed:', err.message)
  process.exitCode = 1
} finally {
  await disconnectDB()
}
