import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import PushSubscription from '@/models/PushSubscription'
import { deletePushSubscription, isWebPushReady } from '@/lib/webPush'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const count = await PushSubscription.countDocuments({ userId: (session.user as any).id })
  return NextResponse.json({
    supported: isWebPushReady(),
    subscribed: count > 0,
    count,
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isWebPushReady()) return NextResponse.json({ error: 'Web push is not configured' }, { status: 500 })

  const body = await req.json()
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 })
  }

  await connectDB()
  const subscription = await PushSubscription.findOneAndUpdate(
    { endpoint: body.endpoint },
    {
      userId: (session.user as any).id,
      endpoint: body.endpoint,
      expirationTime: body.expirationTime ?? null,
      keys: body.keys,
      userAgent: req.headers.get('user-agent') || '',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return NextResponse.json({ success: true, subscription })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body?.endpoint) return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })

  await connectDB()
  await deletePushSubscription(body.endpoint, (session.user as any).id)
  return NextResponse.json({ success: true })
}
