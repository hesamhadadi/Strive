import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

function getIsoWeekKey(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${weekNo}`
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findById((session.user as any).id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const weekKey = getIsoWeekKey(new Date())
  if (user.freezeWeekKey !== weekKey) {
    user.freezeWeekKey = weekKey
    user.freezesUsedInWeek = 0
  }

  if ((user.freezesUsedInWeek || 0) >= 1) {
    return NextResponse.json({ error: 'Weekly freeze already used' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  const freezeDates = Array.isArray(user.freezeDates) ? user.freezeDates : []
  if (!freezeDates.includes(today)) freezeDates.push(today)
  user.freezeDates = freezeDates
  user.freezesUsedInWeek = (user.freezesUsedInWeek || 0) + 1

  await user.save()
  return NextResponse.json({
    success: true,
    freezesUsedInWeek: user.freezesUsedInWeek,
    freezeWeekKey: user.freezeWeekKey,
    freezeDates: user.freezeDates,
  })
}
