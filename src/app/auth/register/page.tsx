'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    // Auto-login after register
    await signIn('credentials', { email, password, redirect: false })
    router.push('/dashboard')
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden bg-ink">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-aurora-purple opacity-[0.05] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-aurora-green opacity-[0.04] blur-[100px] pointer-events-none" />

      <div className="mb-8 text-center animate-slide_up">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(0,212,255,0.15))', border: '1px solid rgba(139,92,246,0.2)' }}>
          <span className="text-2xl">🌱</span>
        </div>
        <h1 className="font-display text-3xl font-black text-white mb-1">Start your journey</h1>
        <p className="text-sm text-white/40">Join HabitFlow and transform your daily life</p>
      </div>

      <div className="w-full max-w-sm gradient-border animate-slide_up" style={{ animationDelay: '0.1s' }}>
        <div className="p-8 rounded-2xl" style={{ background: 'rgba(17,17,24,0.8)', backdropFilter: 'blur(40px)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', value: name, set: setName, type: 'text', placeholder: 'Hesam Hadadi' },
              { label: 'Email', value: email, set: setEmail, type: 'email', placeholder: 'you@example.com' },
              { label: 'Password', value: password, set: setPassword, type: 'password', placeholder: '8+ characters' },
            ].map(({ label, value, set, type, placeholder }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={e => set(e.target.value)}
                  required
                  placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all duration-200"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>
            ))}

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 mt-2"
              style={{ background: loading ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg, #8B5CF6, #00D4FF)' }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-aurora-purple hover:text-white transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Default habits preview */}
      <div className="mt-6 text-center animate-slide_up" style={{ animationDelay: '0.2s' }}>
        <p className="text-xs text-white/30 mb-2">5 habits added automatically</p>
        <div className="flex gap-2 justify-center">
          {['💧', '💊', '🏃', '📚', '🧘'].map(icon => (
            <span key={icon} className="text-lg">{icon}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
