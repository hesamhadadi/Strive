'use client'

import { Bell, BellRing, CloudLightning, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  getResolvedTimeZone,
  requestNotificationPermission,
  sendBrowserNotification,
  subscribeToWebPush,
  supportsNotifications,
  unsubscribeFromWebPush,
} from '@/lib/notifications'

export default function NotificationTester() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [timeZone, setTimeZone] = useState('local time')
  const [message, setMessage] = useState('')
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [publicKey, setPublicKey] = useState('')

  useEffect(() => {
    setTimeZone(getResolvedTimeZone())
    setPermission(supportsNotifications() ? Notification.permission : 'unsupported')
    setPushSupported(typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window)

    fetch('/api/push/subscribe')
      .then(r => r.json())
      .then(data => {
        setPushSubscribed(Boolean(data.subscribed))
        setPublicKey(data.publicKey || '')
      })
      .catch(() => null)
  }, [])

  async function enableNotifications() {
    const result = await requestNotificationPermission()
    setPermission(result)
    setMessage(result === 'granted' ? 'Notifications enabled.' : 'Permission not granted.')
  }

  async function sendTestNotification() {
    if (!supportsNotifications()) {
      setMessage('This browser does not support notifications.')
      return
    }

    if (Notification.permission !== 'granted') {
      const result = await requestNotificationPermission()
      setPermission(result)
      if (result !== 'granted') {
        setMessage('Browser blocked the notification permission.')
        return
      }
    }

    const sent = await sendBrowserNotification({
      title: 'Strive test notification',
      body: `If you can read this, notifications are working in ${timeZone}.`,
      tag: `notification-test-${Date.now()}`,
    })

    setPermission(Notification.permission)
    setMessage(sent ? 'Local test notification sent.' : 'Notification API did not deliver the test notification.')
  }

  async function enableBackgroundPush() {
    if (!publicKey) {
      setMessage('Push public key is missing on the server.')
      return
    }

    const result = await requestNotificationPermission()
    setPermission(result)
    if (result !== 'granted') {
      setMessage('Allow notifications first, then enable background push.')
      return
    }

    const subscription = await subscribeToWebPush(publicKey)
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    })

    if (response.ok) {
      setPushSubscribed(true)
      setMessage('Background push subscription saved.')
    } else {
      setMessage('Could not save push subscription.')
    }
  }

  async function disableBackgroundPush() {
    const endpoint = await unsubscribeFromWebPush()
    if (endpoint) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })
    }
    setPushSubscribed(false)
    setMessage('Background push disabled on this device.')
  }

  async function sendPushTest() {
    const response = await fetch('/api/push/test', { method: 'POST' })
    const data = await response.json()
    if (!response.ok) {
      setMessage(data.error || 'Push test failed.')
      return
    }

    setMessage(data.sent > 0 ? 'Background push test sent.' : 'No active push subscription found for this account.')
  }

  return (
    <div className="rounded-3xl p-4" style={{ background: 'rgba(26,26,36,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Notification Test</h2>
          <p className="text-xs text-white/40 mt-1">Timezone: {timeZone}</p>
          <p className="text-xs mt-1" style={{ color: permission === 'granted' ? '#00FF88' : permission === 'denied' ? '#FF6B35' : 'rgba(255,255,255,0.45)' }}>
            Permission: {permission}
          </p>
          <p className="text-xs mt-1" style={{ color: pushSubscribed ? '#00D4FF' : 'rgba(255,255,255,0.45)' }}>
            Background push: {pushSubscribed ? 'enabled' : 'not enabled'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <BellRing size={18} className="text-sky-300" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button type="button" onClick={enableNotifications} className="rounded-xl py-3 text-xs font-semibold" style={{ background: 'rgba(255,214,10,0.14)', color: '#FFD60A', border: '1px solid rgba(255,214,10,0.25)' }}>
          Request permission
        </button>
        <button type="button" onClick={sendTestNotification} className="rounded-xl py-3 text-xs font-semibold flex items-center justify-center gap-2" style={{ background: 'rgba(0,255,136,0.14)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }}>
          <Bell size={14} />
          Local test
        </button>
      </div>

      {pushSupported && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button type="button" onClick={pushSubscribed ? disableBackgroundPush : enableBackgroundPush} className="rounded-xl py-3 text-xs font-semibold flex items-center justify-center gap-2" style={{ background: 'rgba(0,212,255,0.14)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.25)' }}>
            <ShieldCheck size={14} />
            {pushSubscribed ? 'Disable push' : 'Enable push'}
          </button>
          <button type="button" onClick={sendPushTest} className="rounded-xl py-3 text-xs font-semibold flex items-center justify-center gap-2" style={{ background: 'rgba(139,92,246,0.16)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.28)' }}>
            <CloudLightning size={14} />
            Push test
          </button>
        </div>
      )}

      {message ? <p className="text-xs text-white/55 mt-3">{message}</p> : null}
    </div>
  )
}
