import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Habit from '@/models/Habit'
import HabitLog from '@/models/HabitLog'
import { HABIT_LOG_REASONS, type HabitLogReason } from '@/lib/habitLogReasons'

const REASONS = new Set(HABIT_LOG_REASONS)
const isHabitLogReason = (value: string): value is HabitLogReason => REASONS.has(value as HabitLogReason)

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, action, reason, note } = await req.json()
  const safeNote = typeof note === 'string' ? note.trim().slice(0, 120) : undefined
  const safeReason = typeof reason === 'string' && isHabitLogReason(reason) ? reason : undefined
  await connectDB()

  const habit = await Habit.findOne({ _id: params.id, userId: (session.user as any).id })
  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const habitLogQuery = {
    habitId: habit._id.toString(),
    userId: (session.user as any).id,
    date,
  }

  if (action === 'toggle_completion') {
    const idx = habit.completions.indexOf(date)
    if (idx > -1) {
      habit.completions.splice(idx, 1)
      await HabitLog.findOneAndDelete(habitLogQuery)
    } else {
      habit.completions.push(date)
      await HabitLog.findOneAndUpdate(
        habitLogQuery,
        {
          $set: {
            completed: true,
            completedAt: new Date(),
          },
          $unset: {
            reason: 1,
            note: 1,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    }
  }

  if (action === 'toggle_clean') {
    const idx = habit.cleanDays.indexOf(date)
    if (idx > -1) habit.cleanDays.splice(idx, 1)
    else habit.cleanDays.push(date)
  }

  if (action === 'log_missed') {
    await HabitLog.findOneAndUpdate(
      habitLogQuery,
      {
        $set: {
          completed: false,
          reason: safeReason,
          note: safeNote,
        },
        $unset: {
          completedAt: 1,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  }

  await habit.save()
  return NextResponse.json(habit)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  await Habit.deleteOne({ _id: params.id, userId: (session.user as any).id })
  return NextResponse.json({ success: true })
}
