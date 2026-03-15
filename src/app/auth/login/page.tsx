'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email, password, redirect: false,
    })

    if (res?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden bg-ink">
      {/* Ambient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-aurora-green opacity-[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-aurora-purple opacity-[0.05] blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-aurora-teal opacity-[0.04] blur-[80px] pointer-events-none" />

      {/* Logo */}
      <div className="mb-10 text-center animate-slide_up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative"
          style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,212,255,0.15))', border: '1px solid rgba(0,255,136,0.2)' }}>
          <span className="text-3xl">⚡</span>
          <div className="absolute inset-0 rounded-2xl animate-pulse_glow" />
        </div>
        <h1 className="font-display text-3xl font-black text-white mb-1">HabitFlow</h1>
        <p className="text-sm text-white/40 font-body">Build your best self, one day at a time</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm gradient-border animate-slide_up" style={{ animationDelay: '0.1s' }}>
        <div className="p-8 rounded-2xl" style={{ background: 'rgba(17,17,24,0.8)', backdropFilter: 'blur(40px)' }}>
          <h2 className="font-display text-xl font-bold mb-6 text-white">Welcome back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all duration-200 font-body"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all duration-200 font-body"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm text-red-400 font-body"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-ink transition-all duration-200 relative overflow-hidden font-body mt-2"
              style={{ background: loading ? 'rgba(0,255,136,0.5)' : 'linear-gradient(135deg, #00FF88, #00D4FF)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40 font-body">
            New here?{' '}
            <Link href="/auth/register" className="text-aurora-green hover:text-white transition-colors font-medium">
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom tagline */}
      <p className="mt-8 text-xs text-white/20 text-center animate-slide_up" style={{ animationDelay: '0.2s' }}>
        Your streak starts today 🔥
      </p>
    </div>
  )
}
