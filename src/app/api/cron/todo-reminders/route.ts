import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Todo from '@/models/Todo'
import { getDateInTimeZone, getTimeInTimeZone, sendPushToUser } from '@/lib/webPush'

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const todos = await Todo.find({
    completed: false,
    reminderEnabled: true,
    reminderTime: { $exists: true, $ne: '' },
  }).lean()

  let triggered = 0

  for (const todo of todos as any[]) {
    const timeZone = todo.reminderTimezone || 'UTC'
    const localDate = getDateInTimeZone(timeZone)
    const localTime = getTimeInTimeZone(timeZone)

    if (todo.lastReminderDate === localDate) continue
    if (localTime < todo.reminderTime) continue

    const result = await sendPushToUser(todo.userId, {
      title: 'Task reminder',
      body: `You still need to finish "${todo.title}".`,
      url: '/dashboard/todos',
      tag: `todo-reminder-${todo._id}-${localDate}`,
    })

    if (result.sent > 0) {
      await Todo.updateOne({ _id: todo._id }, { $set: { lastReminderDate: localDate } })
      triggered += 1
    }
  }

  return NextResponse.json({ success: true, triggered })
}
