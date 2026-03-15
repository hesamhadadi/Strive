import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Habit from '@/models/Habit'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, action } = await req.json()
  await connectDB()

  const habit = await Habit.findOne({ _id: params.id, userId: (session.user as any).id })
  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'toggle_completion') {
    const idx = habit.completions.indexOf(date)
    if (idx > -1) habit.completions.splice(idx, 1)
    else habit.completions.push(date)
  }

  if (action === 'toggle_clean') {
    const idx = habit.cleanDays.indexOf(date)
    if (idx > -1) habit.cleanDays.splice(idx, 1)
    else habit.cleanDays.push(date)
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
