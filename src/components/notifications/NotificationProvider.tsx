'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { isReminderDue, sendBrowserNotification, supportsNotifications } from '@/lib/notifications'

interface TodoReminder {
  _id: string
  title: string
  completed: boolean
  reminderEnabled?: boolean
  reminderTime?: string
  lastReminderDate?: string
  priority: 'low' | 'medium' | 'high'
}

export default function NotificationProvider() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')

  useEffect(() => {
    if (!supportsNotifications()) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission)
  }, [])

  useEffect(() => {
    if (!supportsNotifications()) return
    const syncPermission = () => setPermission(Notification.permission)
    syncPermission()
    window.addEventListener('focus', syncPermission)
    document.addEventListener('visibilitychange', syncPermission)
    return () => {
      window.removeEventListener('focus', syncPermission)
      document.removeEventListener('visibilitychange', syncPermission)
    }
  }, [])

  useEffect(() => {
    if (permission !== 'granted') return

    let cancelled = false

    async function checkReminders() {
      const response = await fetch('/api/todos', { cache: 'no-store' })
      const todos = await response.json() as TodoReminder[]
      const today = format(new Date(), 'yyyy-MM-dd')

      for (const todo of todos) {
        if (cancelled) return
        if (todo.completed || !todo.reminderEnabled) continue
        if (todo.lastReminderDate === today) continue
        if (!isReminderDue(todo.reminderTime)) continue

        const sent = await sendBrowserNotification({
          title: 'Task reminder',
          body: `You still need to finish "${todo.title}" today.`,
          tag: `todo-reminder-${todo._id}-${today}`,
        })

        if (!sent) continue

        await fetch(`/api/todos/${todo._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastReminderDate: today }),
        })
      }
    }

    checkReminders()
    const interval = window.setInterval(checkReminders, 60_000)
    window.addEventListener('focus', checkReminders)
    document.addEventListener('visibilitychange', checkReminders)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener('focus', checkReminders)
      document.removeEventListener('visibilitychange', checkReminders)
    }
  }, [permission])

  return null
}
