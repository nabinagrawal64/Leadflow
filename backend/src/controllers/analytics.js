import { Activity, Lead } from '../models/index.js'
import { STAGES } from '../constants/index.js'
import { sendSuccess } from '../utils/response.js'

// GET /dashboard/analytics
export async function analytics(req, res) {
  const createdBy = req.user._id

  // Leads by stage
  const stagePipeline = await Lead.aggregate([
    { $match: { createdBy } },
    { $group: { _id: '$stage', count: { $sum: 1 }, totalBudget: { $sum: '$budget' } } },
  ])

  // Leads by source
  const sourcePipeline = await Lead.aggregate([
    { $match: { createdBy } },
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ])

  // Leads by serviceInterest
  const servicePipeline = await Lead.aggregate([
    { $match: { createdBy } },
    { $group: { _id: '$serviceInterest', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ])

  // Leads created per month (last 12 months)
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  const monthlyLeads = await Lead.aggregate([
    { $match: { createdBy, createdAt: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ])

  // Activity completion rate
  const [totalActivities, completedActivities] = await Promise.all([
    Activity.countDocuments({ createdBy }),
    Activity.countDocuments({ createdBy, status: 'Completed' }),
  ])

  // Average time to complete activities (days)
  const avgCompletionTime = await Activity.aggregate([
    { $match: { createdBy, status: 'Completed', completedAt: { $exists: true } } },
    {
      $group: {
        _id: null,
        avgDays: {
          $avg: {
            $divide: [{ $subtract: ['$completedAt', '$createdAt'] }, 1000 * 60 * 60 * 24],
          },
        },
      },
    },
  ])

  // Normalise: ensure every stage appears in the response
  const byStage = Object.fromEntries(STAGES.map((s) => [s, { count: 0, totalBudget: 0 }]))
  for (const item of stagePipeline) {
    if (item._id) byStage[item._id] = { count: item.count, totalBudget: item.totalBudget || 0 }
  }

  sendSuccess(res, {
    byStage,
    bySource: sourcePipeline.map((r) => ({ name: r._id || 'Unknown', count: r.count })),
    byService: servicePipeline.map((r) => ({ name: r._id || 'Unknown', count: r.count })),
    monthlyLeads: monthlyLeads.map((r) => ({
      year: r._id.year,
      month: r._id.month,
      count: r.count,
    })),
    activities: {
      total: totalActivities,
      completed: completedActivities,
      completionRate: totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0,
      avgCompletionDays: avgCompletionTime[0]?.avgDays != null ? Math.round(avgCompletionTime[0].avgDays * 10) / 10 : null,
    },
  })
}
