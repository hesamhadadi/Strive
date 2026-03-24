import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Habit from '@/models/Habit'
import HabitLog from '@/models/HabitLog'

const REASONS = new Set(['tired', 'no_time', 'sick', 'forgot', 'other'])

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, action, reason, note } = await req.json()
  const safeNote = typeof note === 'string' ? note.trim().slice(0, 120) : undefined
  const safeReason = typeof reason === 'string' && REASONS.has(reason) ? reason : undefined
  await connectDB()

  const habit = await Habit.findOne({ _id: params.id, userId: (session.user as any).id })
  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'toggle_completion') {
    const idx = habit.completions.indexOf(date)
    if (idx > -1) {
      habit.completions.splice(idx, 1)
      await HabitLog.findOneAndDelete({ habitId: habit._id.toString(), userId: (session.user as any).id, date })
    } else {
      habit.completions.push(date)
      await HabitLog.findOneAndUpdate(
        { habitId: habit._id.toString(), userId: (session.user as any).id, date },
        {
          completed: true,
          reason: undefined,
          note: undefined,
          completedAt: new Date(),
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
      { habitId: habit._id.toString(), userId: (session.user as any).id, date },
      {
        completed: false,
        reason: safeReason,
        note: safeNote,
        completedAt: undefined,
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
