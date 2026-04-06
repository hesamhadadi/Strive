'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import {
  getReminderDelayMs,
  isReminderDue,
  sendBrowserNotification,
  supportsNotifications,
} from '@/lib/notifications'

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
  const timersRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (!supportsNotifications()) {
      setPermission('unsupported')
      return
    }

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

    const clearTimers = () => {
      for (const timer of Array.from(timersRef.current.values())) {
        window.clearTimeout(timer)
      }
      timersRef.current.clear()
    }

    async function markReminderSent(todoId: string, today: string) {
      await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastReminderDate: today }),
      })
    }

    async function deliverReminder(todo: TodoReminder) {
      const today = format(new Date(), 'yyyy-MM-dd')
      if (todo.completed || !todo.reminderEnabled || todo.lastReminderDate === today) return

      const sent = await sendBrowserNotification({
        title: 'Task reminder',
        body: `You still need to finish "${todo.title}" today.`,
        tag: `todo-reminder-${todo._id}-${today}`,
      })

      if (sent) {
        await markReminderSent(todo._id, today)
      }
    }

    async function syncSchedules() {
      if (cancelled) return
      clearTimers()

      const response = await fetch('/api/todos', { cache: 'no-store' })
      const todos = await response.json() as TodoReminder[]
      const today = format(new Date(), 'yyyy-MM-dd')

      for (const todo of todos) {
        if (cancelled) return
        if (todo.completed || !todo.reminderEnabled) continue
        if (todo.lastReminderDate === today) continue

        if (isReminderDue(todo.reminderTime)) {
          await deliverReminder(todo)
          continue
        }

        const delay = getReminderDelayMs(todo.reminderTime)
        if (delay === null) continue

        const timer = window.setTimeout(() => {
          deliverReminder(todo).catch(() => null)
          timersRef.current.delete(todo._id)
        }, delay)

        timersRef.current.set(todo._id, timer)
      }
    }

    syncSchedules()
    const refresh = window.setInterval(syncSchedules, 60_000)
    window.addEventListener('focus', syncSchedules)
    document.addEventListener('visibilitychange', syncSchedules)

    return () => {
      cancelled = true
      clearTimers()
      window.clearInterval(refresh)
      window.removeEventListener('focus', syncSchedules)
      document.removeEventListener('visibilitychange', syncSchedules)
    }
  }, [permission])

  return null
}
