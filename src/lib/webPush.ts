import webpush from 'web-push'
import PushSubscription from '@/models/PushSubscription'

type PushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
}

let configured = false

function configureWebPush() {
  if (configured) return true

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || `mailto:${process.env.ADMIN_EMAIL || 'admin@example.com'}`

  if (!publicKey || !privateKey) return false

  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export function isWebPushReady() {
  return configureWebPush()
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!configureWebPush()) {
    throw new Error('Web push is not configured')
  }

  const subscriptions = await PushSubscription.find({ userId }).lean()
  const expiredEndpoints: string[] = []

  await Promise.all(subscriptions.map(async subscription => {
    try {
      await webpush.sendNotification(subscription as any, JSON.stringify(payload))
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        expiredEndpoints.push(subscription.endpoint)
      }
    }
  }))

  if (expiredEndpoints.length > 0) {
    await PushSubscription.deleteMany({ endpoint: { $in: expiredEndpoints } })
  }

  return { sent: subscriptions.length - expiredEndpoints.length, total: subscriptions.length }
}

export async function deletePushSubscription(endpoint: string, userId?: string) {
  const query: Record<string, string> = { endpoint }
  if (userId) query.userId = userId
  await PushSubscription.deleteOne(query)
}

export function getDateInTimeZone(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value
  const day = parts.find(part => part.type === 'day')?.value

  return `${year}-${month}-${day}`
}

export function getTimeInTimeZone(timeZone: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}
