import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import TopBar from '@/components/layout/TopBar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-dvh flex flex-col bg-ink noise">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-[30%] w-[400px] h-[400px] rounded-full opacity-[0.04] blur-[100px]"
          style={{ background: 'radial-gradient(circle, #FFD60A, transparent)' }} />
      </div>
      <TopBar user={{ name: session.user?.name || '', email: session.user?.email || '', role: (session.user as any)?.role }} />
      <main className="flex-1 relative z-10 pb-32 pt-2">{children}</main>
      <BottomNav />
    </div>
  )
}
