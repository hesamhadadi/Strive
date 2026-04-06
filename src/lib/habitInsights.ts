import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  getDate,
  getDay,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns'

export type HabitFrequency = 'daily' | 'weekly' | 'monthly'

export interface HabitMoodLog {
  date: string
  mood: number
  note?: string
}

export interface HabitDurationLog {
  date: string
  minutes: number
}

export interface HabitInsightShape {
  _id?: string
  name: string
  type: 'good' | 'bad'
  completions: string[]
  cleanDays: string[]
  frequency?: HabitFrequency
  scheduledDays?: number[]
  monthlyDays?: number[]
  targetCount?: number
  durationTargetMinutes?: number
  durationLogs?: HabitDurationLog[]
  moodLogs?: HabitMoodLog[]
  reminderTime?: string
  locationLabel?: string
  notes?: string
  twoDayRule?: boolean
  costPerDay?: number
  currency?: string
}

export function getHabitFrequency(habit: HabitInsightShape): HabitFrequency {
  return habit.frequency || 'daily'
}

export function getTrackedDates(habit: HabitInsightShape): string[] {
  return habit.type === 'bad' ? habit.cleanDays || [] : habit.completions || []
}

export function isHabitScheduledOnDate(habit: HabitInsightShape, date: string): boolean {
  const parsed = parseISO(`${date}T00:00:00`)
  const frequency = getHabitFrequency(habit)

  if (frequency === 'daily') return true

  if (frequency === 'weekly') {
    const days = habit.scheduledDays || []
    return days.length === 0 ? true : days.includes(getDay(parsed))
  }

  const monthlyDays = habit.monthlyDays || []
  return monthlyDays.length === 0 ? true : monthlyDays.includes(getDate(parsed))
}

export function getHabitTargetCount(habit: HabitInsightShape): number {
  if (habit.targetCount && habit.targetCount > 0) return habit.targetCount

  const frequency = getHabitFrequency(habit)
  if (frequency === 'weekly') return Math.max(habit.scheduledDays?.length || 1, 1)
  if (frequency === 'monthly') return Math.max(habit.monthlyDays?.length || 1, 1)
  return 1
}

export function getDurationForDate(habit: HabitInsightShape, date: string): number {
  return (habit.durationLogs || [])
    .filter(log => log.date === date)
    .reduce((sum, log) => sum + (log.minutes || 0), 0)
}

export function getCurrentStreak(habit: HabitInsightShape, today: string): number {
  const trackedDates = new Set(getTrackedDates(habit))
  let cursor = today
  let streak = 0

  while (true) {
    if (!isHabitScheduledOnDate(habit, cursor)) {
      cursor = shiftDate(cursor, -1)
      continue
    }

    if (!trackedDates.has(cursor)) break

    streak += 1
    cursor = shiftDate(cursor, -1)
  }

  return streak
}

export function getPeriodStreak(
  habit: HabitInsightShape,
  today: string,
  period: 'week' | 'month'
): number {
  let anchor = parseISO(`${today}T00:00:00`)
  let streak = 0

  while (true) {
    const range = getPeriodRange(anchor, period)
    const completed = countCompletedInRange(habit, range.start, range.end)
    if (completed < getHabitTargetCount(habit)) break
    streak += 1
    anchor = period === 'week'
      ? subDays(startOfWeek(anchor, { weekStartsOn: 1 }), 1)
      : subDays(startOfMonth(anchor), 1)
  }

  return streak
}

export function getCompletionRate(habit: HabitInsightShape, today: string, days = 30): number {
  let scheduled = 0
  let completed = 0

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = format(subDays(parseISO(`${today}T00:00:00`), offset), 'yyyy-MM-dd')
    if (!isHabitScheduledOnDate(habit, date)) continue
    scheduled += 1
    if (getTrackedDates(habit).includes(date)) completed += 1
  }

  return scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100)
}

export function getTwoDayRuleStatus(habit: HabitInsightShape, today: string): {
  consecutiveMisses: number
  atRisk: boolean
  broken: boolean
} {
  const trackedDates = new Set(getTrackedDates(habit))
  let cursor = today
  let misses = 0

  while (misses < 2) {
    if (!isHabitScheduledOnDate(habit, cursor)) {
      cursor = shiftDate(cursor, -1)
      continue
    }

    if (trackedDates.has(cursor)) break
    misses += 1
    cursor = shiftDate(cursor, -1)
  }

  return {
    consecutiveMisses: misses,
    atRisk: Boolean(habit.twoDayRule) && misses === 1,
    broken: Boolean(habit.twoDayRule) && misses >= 2,
  }
}

export function getUpcomingDates(habit: HabitInsightShape, start: string, horizon = 7): string[] {
  const startDate = parseISO(`${start}T00:00:00`)
  return Array.from({ length: horizon }, (_, index) => format(addDays(startDate, index), 'yyyy-MM-dd'))
    .filter(date => isHabitScheduledOnDate(habit, date))
}

export function getPeriodRange(date: Date, period: 'week' | 'month'): { start: string; end: string } {
  if (period === 'week') {
    return {
      start: format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      end: format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    }
  }

  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  }
}

export function countCompletedInRange(habit: HabitInsightShape, start: string, end: string): number {
  const trackedDates = new Set(getTrackedDates(habit))
  const startDate = parseISO(`${start}T00:00:00`)
  const endDate = parseISO(`${end}T00:00:00`)
  const days = differenceInCalendarDays(endDate, startDate)
  let completed = 0

  for (let offset = 0; offset <= days; offset += 1) {
    const date = format(addDays(startDate, offset), 'yyyy-MM-dd')
    if (trackedDates.has(date)) completed += 1
  }

  return completed
}

function shiftDate(date: string, amount: number): string {
  return format(addDays(parseISO(`${date}T00:00:00`), amount), 'yyyy-MM-dd')
}
