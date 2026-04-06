'use client'

export type TodoNotificationPayload = {
  title: string
  body: string
  tag: string
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from(Array.from(rawData).map(char => char.charCodeAt(0)))
}

export function supportsNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getLocalDefaultReminderTime() {
  const now = new Date()
  const rounded = new Date(now)
  const minutes = rounded.getMinutes()
  const nextQuarter = Math.ceil((minutes + 1) / 15) * 15
  rounded.setSeconds(0, 0)

  if (nextQuarter >= 60) {
    rounded.setHours(rounded.getHours() + 1, 0, 0, 0)
  } else {
    rounded.setMinutes(nextQuarter, 0, 0)
  }

  return rounded.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function getResolvedTimeZone() {
  if (typeof Intl === 'undefined') return 'local time'
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time'
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

export async function subscribeToWebPush(publicKey: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push messaging is not supported in this browser')
  }

  const registration = await navigator.serviceWorker.ready
  const existingSubscription = await registration.pushManager.getSubscription()
  if (existingSubscription) return existingSubscription

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })
}

export async function unsubscribeFromWebPush() {
  if (!('serviceWorker' in navigator)) return false
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return false
  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  return endpoint
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

export function getReminderDelayMs(reminderTime?: string) {
  if (!reminderTime) return null
  const [hours, minutes] = reminderTime.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  const now = new Date()
  const due = new Date()
  due.setHours(hours, minutes, 0, 0)

  return Math.max(due.getTime() - now.getTime(), 0)
}
