import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Habit from '@/models/Habit'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const habits = await Habit.find({ userId: (session.user as any).id }).sort({ createdAt: 1 })
  return NextResponse.json(habits)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  await connectDB()

  const habit = await Habit.create({
    ...body,
    userId: (session.user as any).id,
    timeOfDay: body.timeOfDay || 'anytime',
    completions: [],
    cleanDays: [],
    moodLogs: [],
    durationLogs: [],
    frequency: body.frequency || 'daily',
    scheduledDays: body.scheduledDays || [],
    monthlyDays: body.monthlyDays || [],
    targetCount: body.targetCount || 1,
    durationTargetMinutes: body.durationTargetMinutes || undefined,
    reminderTime: body.reminderTime || '',
    locationLabel: body.locationLabel || '',
    notes: body.notes || '',
    twoDayRule: body.twoDayRule ?? true,
  })

  return NextResponse.json(habit, { status: 201 })
}
