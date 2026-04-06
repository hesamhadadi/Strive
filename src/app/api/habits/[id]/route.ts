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

  const { date, action, reason, note, minutes, mood, updates } = await req.json()
  const safeNote = typeof note === 'string' ? note.trim().slice(0, 120) : undefined
  const safeReason = typeof reason === 'string' && isHabitLogReason(reason) ? reason : undefined
  await connectDB()

  const userId = (session.user as any).id
  const habit = await Habit.findOne({ _id: params.id, userId })
  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!habit.durationLogs) habit.durationLogs = []
  if (!habit.moodLogs) habit.moodLogs = []
  if (!habit.scheduledDays) habit.scheduledDays = []
  if (!habit.monthlyDays) habit.monthlyDays = []

  const habitLogQuery = {
    habitId: habit._id.toString(),
    userId,
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

  if (action === 'log_duration' && date && minutes) {
    const index = habit.durationLogs.findIndex((log: { date: string }) => log.date === date)
    if (index > -1) {
      habit.durationLogs[index].minutes += Number(minutes)
    } else {
      habit.durationLogs.push({ date, minutes: Number(minutes) })
    }

    if (habit.durationTargetMinutes && habit.durationTargetMinutes > 0) {
      const totalMinutes = habit.durationLogs
        .filter((log: { date: string }) => log.date === date)
        .reduce((sum: number, log: { minutes: number }) => sum + log.minutes, 0)

      const completionIndex = habit.completions.indexOf(date)
      if (totalMinutes >= habit.durationTargetMinutes && completionIndex === -1) {
        habit.completions.push(date)
      }
    }
  }

  if (action === 'log_mood' && date && mood) {
    const index = habit.moodLogs.findIndex((log: { date: string }) => log.date === date)
    if (index > -1) {
      habit.moodLogs[index].mood = Number(mood)
      habit.moodLogs[index].note = note || ''
    } else {
      habit.moodLogs.push({ date, mood: Number(mood), note: note || '' })
    }
  }

  if (action === 'update_meta' && updates) {
    const allowedKeys = [
      'notes',
      'frequency',
      'scheduledDays',
      'monthlyDays',
      'targetCount',
      'durationTargetMinutes',
      'reminderTime',
      'locationLabel',
      'twoDayRule',
      'timeOfDay',
      'weeklyTarget',
    ]

    for (const key of allowedKeys) {
      if (key in updates) {
        ;(habit as any)[key] = updates[key]
      }
    }
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
