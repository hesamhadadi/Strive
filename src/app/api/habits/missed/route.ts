import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Habit from '@/models/Habit'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const today = new Date().toISOString().split('T')[0]

  const habits = await Habit.find({ userId: (session.user as any).id, type: 'good' }).select('_id name icon color completions')
  const missedHabits = habits.filter(h => !h.completions.includes(today))

  return NextResponse.json({
    date: today,
    count: missedHabits.length,
    habits: missedHabits.map(h => ({
      _id: h._id.toString(),
      name: h.name,
      icon: h.icon,
      color: h.color,
    })),
  })
}
