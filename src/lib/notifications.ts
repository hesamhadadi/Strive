'use client'

export type TodoNotificationPayload = {
  title: string
  body: string
  tag: string
}

export function supportsNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotificationPermission() {
  if (!supportsNotifications()) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

export async function sendBrowserNotification(payload: TodoNotificationPayload) {
  if (!supportsNotifications() || Notification.permission !== 'granted') return false

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.showNotification(payload.title, {
          body: payload.body,
          tag: payload.tag,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
        })
        return true
      }
    }

    new Notification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      icon: '/icons/icon-192.png',
    })
    return true
  } catch {
    return false
  }
}

export function isReminderDue(reminderTime?: string) {
  if (!reminderTime) return false
  const [hours, minutes] = reminderTime.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return false

  const now = new Date()
  const due = new Date()
  due.setHours(hours, minutes, 0, 0)
  return now >= due
}
