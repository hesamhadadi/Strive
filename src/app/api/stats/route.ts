import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Habit from '@/models/Habit'
import Todo from '@/models/Todo'
import User from '@/models/User'
import HabitLog from '@/models/HabitLog'
import { format, subDays } from 'date-fns'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  await connectDB()

  const habits = await Habit.find({ userId })
  const todos = await Todo.find({ userId })
  const user = await User.findById(userId)

  const today = format(new Date(), 'yyyy-MM-dd')

  // Good habits completed today
  const goodHabits = habits.filter(h => h.type === 'good')
  const completedToday = goodHabits.filter(h => h.completions.includes(today)).length

  // Bad habits: calculate savings + health for smoking
  const badHabits = habits.filter(h => h.type === 'bad')
  const badHabitStats = badHabits.map(h => {
    const cleanCount = h.cleanDays.length
    const saved = cleanCount * (h.costPerDay || 0)
    return {
      id: h._id,
      name: h.name,
      cleanDays: cleanCount,
      moneySaved: saved,
      currency: h.currency || '€',
    }
  })

  // Weekly completion rate (last 7 days)
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    const completed = goodHabits.filter(h => h.completions.includes(date)).length
    return { date, completed, total: goodHabits.length }
  })

  const freezeDates: string[] = Array.isArray(user?.freezeDates) ? user.freezeDates : []

  // Current streak (supports freeze dates)
  let streak = 0
  let checkDate = new Date()
  while (true) {
    const d = format(checkDate, 'yyyy-MM-dd')
    const allDone = goodHabits.length > 0 && goodHabits.every(h => h.completions.includes(d))
    const frozen = freezeDates.includes(d)
    if (!allDone && !frozen) break
    streak++
    checkDate = subDays(checkDate, 1)
  }

  const personalBestStreak = calculatePersonalBest(goodHabits, freezeDates)
  const milestones = [7, 14, 30, 60, 90, 180, 365]
  const earnedMilestones = milestones.filter(m => personalBestStreak >= m)

  // persist streak summary + milestones on user profile
  if (user) {
    user.streak = streak
    if ((user.longestStreak || 0) < personalBestStreak) user.longestStreak = personalBestStreak
    user.streakMilestones = earnedMilestones
    await user.save()
  }

  // heatmap (last 90 days)
  const heatmap = Array.from({ length: 90 }, (_, i) => {
    const date = format(subDays(new Date(), 89 - i), 'yyyy-MM-dd')
    const completed = goodHabits.filter(h => h.completions.includes(date)).length
    return {
      date,
      count: completed,
      intensity: goodHabits.length === 0 ? 0 : Math.min(4, Math.ceil((completed / goodHabits.length) * 4)),
    }
  })

  const recentMissedLogs = await HabitLog.find({
    userId,
    completed: false,
    reason: { $exists: true },
  })

  const reasonCounts = recentMissedLogs.reduce((acc: Record<string, number>, log: any) => {
    const key = log.reason || 'other'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const reasonLabelMap: Record<string, string> = {
    tired: 'tired',
    no_time: 'no time',
    sick: 'sick',
    forgot: 'forgot',
    other: 'other reasons',
  }
  const missedPatternText = topReason ? `You mostly skip habits when ${reasonLabelMap[topReason] || 'busy'}` : null

  return NextResponse.json({
    totalGoodHabits: goodHabits.length,
    completedToday,
    streak,
    personalBestStreak,
    badHabitStats,
    weeklyData,
    todosCompleted: todos.filter(t => t.completed).length,
    todosPending: todos.filter(t => !t.completed).length,
    streakFreeze: {
      usedThisWeek: user?.freezesUsedInWeek || 0,
      remainingThisWeek: Math.max(0, 1 - (user?.freezesUsedInWeek || 0)),
      freezeDates,
    },
    heatmap,
    streakMilestones: milestones.map(days => ({ days, earned: earnedMilestones.includes(days) })),
    missedPatternText,
  })
}

function calculatePersonalBest(goodHabits: any[], freezeDates: string[]): number {
  if (goodHabits.length === 0) return 0

  const completeDaySet = new Set<string>()
  const completionCountByDay = new Map<string, number>()
  for (const habit of goodHabits) {
    for (const date of habit.completions) {
      completionCountByDay.set(date, (completionCountByDay.get(date) || 0) + 1)
    }
  }

  Array.from(completionCountByDay.entries())
    .filter(([, count]) => count === goodHabits.length)
    .map(([date]) => date)
    .forEach(date => completeDaySet.add(date))

  freezeDates.forEach(date => completeDaySet.add(date))
  const completeDays = Array.from(completeDaySet).sort()

  if (completeDays.length === 0) return 0

  let best = 1
  let current = 1
  for (let i = 1; i < completeDays.length; i++) {
    const prev = new Date(completeDays[i - 1])
    const next = new Date(completeDays[i])
    prev.setDate(prev.getDate() + 1)
    if (prev.toISOString().split('T')[0] === next.toISOString().split('T')[0]) {
      current++
      if (current > best) best = current
    } else {
      current = 1
    }
  }

  return best
}
