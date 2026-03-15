import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import TopBar from '@/components/layout/TopBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  return (
    <div className="min-h-dvh flex flex-col bg-ink noise">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-[30%] w-[400px] h-[400px] rounded-full opacity-[0.03] blur-[100px]"
          style={{ background: 'radial-gradient(circle, #00FF88, transparent)' }} />
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full opacity-[0.04] blur-[80px]"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }} />
        <div className="absolute bottom-[20%] left-[10%] w-[250px] h-[250px] rounded-full opacity-[0.03] blur-[60px]"
          style={{ background: 'radial-gradient(circle, #00D4FF, transparent)' }} />
      </div>

      <TopBar user={{ name: session.user?.name || '', email: session.user?.email || '', role: (session.user as any)?.role }} />

      <main className="flex-1 relative z-10 pb-32 pt-2">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
