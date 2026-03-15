import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Habit from '@/models/Habit'
import Todo from '@/models/Todo'
import { format, subDays } from 'date-fns'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  await connectDB()

  const habits = await Habit.find({ userId })
  const todos = await Todo.find({ userId })

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

  // Current streak
  let streak = 0
  let checkDate = new Date()
  while (true) {
    const d = format(checkDate, 'yyyy-MM-dd')
    const allDone = goodHabits.length > 0 && goodHabits.every(h => h.completions.includes(d))
    if (!allDone) break
    streak++
    checkDate = subDays(checkDate, 1)
  }

  return NextResponse.json({
    totalGoodHabits: goodHabits.length,
    completedToday,
    streak,
    badHabitStats,
    weeklyData,
    todosCompleted: todos.filter(t => t.completed).length,
    todosPending: todos.filter(t => !t.completed).length,
  })
}
