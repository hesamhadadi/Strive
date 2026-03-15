import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Todo from '@/models/Todo'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  await connectDB()

  const update: any = { ...body }
  if (body.completed === true) update.completedAt = new Date()
  if (body.completed === false) update.completedAt = null

  const todo = await Todo.findOneAndUpdate(
    { _id: params.id, userId: (session.user as any).id },
    update,
    { new: true }
  )

  return NextResponse.json(todo)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  await Todo.deleteOne({ _id: params.id, userId: (session.user as any).id })
  return NextResponse.json({ success: true })
}
