'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/groups'
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName.trim() },
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setMessage('Check your email to confirm your account, then sign in.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1533681904393-3d35bb09e3e0?w=1400&auto=format&fit=crop&q=80"
          alt="Travel destination"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="font-serif text-3xl font-normal leading-snug">
            Your group&apos;s travel home<br />for years to come.
          </p>
          <p className="mt-3 text-sm text-white/70 font-light">
            Track savings, design itineraries, and build travel memories together.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-2xl text-stone-900">Travel Kitty</h1>
            <p className="mt-1 text-sm text-stone-500">Create your account</p>
          </div>

          {message ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-stone-700 bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 leading-relaxed">
                {message}
              </p>
              <Link href="/sign-in" className="btn-primary w-full inline-block text-center">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="label-text block mb-1.5">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Melia"
                  className="input-base"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label-text block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-base"
                  required
                />
              </div>
              <div>
                <label className="label-text block mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="input-base"
                  minLength={8}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-stone-500">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-stone-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
