import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { format, subDays } from 'date-fns'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Habit from '@/models/Habit'
import Todo from '@/models/Todo'
import User from '@/models/User'
import HabitLog from '@/models/HabitLog'
import {
  getCompletionRate,
  getCurrentStreak,
  getDurationForDate,
  getPeriodStreak,
  getTwoDayRuleStatus,
  isHabitScheduledOnDate,
  type HabitInsightShape,
} from '@/lib/habitInsights'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  await connectDB()

  const habits = (await Habit.find({ userId }).lean()) as unknown as HabitInsightShape[]
  const todos = await Todo.find({ userId }).lean()
  const user = await User.findById(userId)
  const today = format(new Date(), 'yyyy-MM-dd')

  const goodHabits = habits.filter(habit => habit.type === 'good')
  const badHabits = habits.filter(habit => habit.type === 'bad')
  const completedToday = goodHabits.filter(habit => habit.completions.includes(today)).length
  const atRiskHabits = goodHabits
    .map(habit => ({
      id: String((habit as any)._id),
      name: habit.name,
      ...getTwoDayRuleStatus(habit, today),
    }))
    .filter(habit => habit.atRisk || habit.broken)

  const weeklyData = Array.from({ length: 7 }, (_, index) => {
    const date = format(subDays(new Date(), 6 - index), 'yyyy-MM-dd')
    const completed = goodHabits.filter(habit => habit.completions.includes(date)).length
    const total = goodHabits.filter(habit => isHabitScheduledOnDate(habit, date)).length
    return { date, completed, total }
  })

  const monthlyHeatmap = Array.from({ length: 28 }, (_, index) => {
    const date = format(subDays(new Date(), 27 - index), 'yyyy-MM-dd')
    const completed = goodHabits.filter(habit => habit.completions.includes(date)).length
    const total = goodHabits.filter(habit => isHabitScheduledOnDate(habit, date)).length
    return { date, completed, total }
  })

  const freezeDates: string[] = Array.isArray(user?.freezeDates) ? user.freezeDates : []
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

  const totalSaved = badHabits.reduce(
    (sum, habit) => sum + habit.cleanDays.length * (habit.costPerDay || 0),
    0
  )
  const avgMood = (() => {
    const moods = goodHabits.flatMap(habit => (habit.moodLogs || []).map(log => log.mood))
    return moods.length === 0 ? null : Number((moods.reduce((sum, mood) => sum + mood, 0) / moods.length).toFixed(1))
  })()
  const timerMinutesThisWeek = goodHabits.reduce((sum, habit) => (
    sum + Array.from({ length: 7 }, (_, index) => {
      const date = format(subDays(new Date(), index), 'yyyy-MM-dd')
      return getDurationForDate(habit, date)
    }).reduce((acc, value) => acc + value, 0)
  ), 0)
  const completionRate30d = goodHabits.length === 0
    ? 0
    : Math.round(goodHabits.reduce((sum, habit) => sum + getCompletionRate(habit, today, 30), 0) / goodHabits.length)
  const overallDailyStreak = goodHabits.length === 0
    ? 0
    : Math.min(...goodHabits.map(habit => getCurrentStreak(habit, today)))
  const bestHabit = goodHabits
    .map(habit => ({
      id: String((habit as any)._id),
      name: habit.name,
      streak: getCurrentStreak(habit, today),
      weeklyStreak: getPeriodStreak(habit, today, 'week'),
      monthlyStreak: getPeriodStreak(habit, today, 'month'),
      completionRate: getCompletionRate(habit, today, 30),
    }))
    .sort((a, b) => b.completionRate - a.completionRate || b.streak - a.streak)[0] || null

  const xp = goodHabits.reduce((sum, habit) => (
    sum +
    habit.completions.length * 10 +
    getPeriodStreak(habit, today, 'week') * 25 +
    getPeriodStreak(habit, today, 'month') * 40
  ), 0)

  const personalBestStreak = calculatePersonalBest(goodHabits, freezeDates)
  const milestones = [7, 14, 30, 60, 90, 180, 365]
  const earnedMilestones = milestones.filter(m => personalBestStreak >= m)

  if (user) {
    user.streak = streak
    if ((user.longestStreak || 0) < personalBestStreak) user.longestStreak = personalBestStreak
    user.streakMilestones = earnedMilestones
    await user.save()
  }

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
  }).lean()

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
    overallDailyStreak,
    weeklyStreak: goodHabits.length === 0 ? 0 : Math.min(...goodHabits.map(habit => getPeriodStreak(habit, today, 'week'))),
    monthlyStreak: goodHabits.length === 0 ? 0 : Math.min(...goodHabits.map(habit => getPeriodStreak(habit, today, 'month'))),
    atRiskHabits,
    totalSaved,
    currency: badHabits[0]?.currency || '€',
    weeklyData,
    monthlyHeatmap,
    todosCompleted: todos.filter(todo => todo.completed).length,
    todosPending: todos.filter(todo => !todo.completed).length,
    streakFreeze: {
      usedThisWeek: user?.freezesUsedInWeek || 0,
      remainingThisWeek: Math.max(0, 1 - (user?.freezesUsedInWeek || 0)),
      freezeDates,
    },
    heatmap,
    streakMilestones: milestones.map(days => ({ days, earned: earnedMilestones.includes(days) })),
    missedPatternText,
    timerMinutesThisWeek,
    completionRate30d,
    avgMood,
    level: Math.floor(xp / 250) + 1,
    xp,
    bestHabit,
  })
}

function calculatePersonalBest(goodHabits: HabitInsightShape[], freezeDates: string[]): number {
  if (goodHabits.length === 0) return 0

  const streakEligibleDaysSet = new Set<string>()
  const completionCountByDay = new Map<string, number>()
  for (const habit of goodHabits) {
    for (const date of habit.completions) {
      completionCountByDay.set(date, (completionCountByDay.get(date) || 0) + 1)
    }
  }

  Array.from(completionCountByDay.entries())
    .filter(([, count]) => count === goodHabits.length)
    .map(([date]) => date)
    .forEach(date => streakEligibleDaysSet.add(date))

  freezeDates.forEach(date => streakEligibleDaysSet.add(date))
  const completeDays = Array.from(streakEligibleDaysSet).sort()

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
