'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/groups'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(redirect)
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=1400&auto=format&fit=crop&q=80"
          alt="Travel destination"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="font-serif text-3xl font-normal leading-snug">
            Plan beautiful trips.<br />Together.
          </p>
          <p className="mt-3 text-sm text-white/70 font-light">
            Shared savings, AI itineraries, and group planning — all in one place.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-2xl text-stone-900">Travel Kitty</h1>
            <p className="mt-1 text-sm text-stone-500">Sign in to your account</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="label-text block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-base"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label-text block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-base"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-stone-900 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
