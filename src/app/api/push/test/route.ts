import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { sendPushToUser } from '@/lib/webPush'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const result = await sendPushToUser((session.user as any).id, {
    title: 'Strive push test',
    body: 'Background web push is configured correctly.',
    url: '/dashboard/todos',
    tag: `push-test-${Date.now()}`,
  })

  return NextResponse.json({ success: true, ...result })
}
