'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type InviteInfo = {
  groupId: string
  groupName: string
  memberCount: number
  expiresAt: string | null
}

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)

  useEffect(() => {
    // Load invite info and check auth state in parallel
    Promise.all([
      fetch(`/api/invites/${params.token}`).then((r) => r.json()),
      createClient().auth.getUser(),
    ]).then(([inviteData, { data: { user } }]) => {
      if (inviteData.error) {
        setError(inviteData.error)
      } else {
        setInvite(inviteData)
      }
      setUser(user)
      setLoading(false)
    })
  }, [params.token])

  async function handleJoin() {
    if (!user) {
      // Send to sign-up, come back after
      router.push(`/sign-up?redirect=/invite/${params.token}`)
      return
    }

    setJoining(true)
    const res = await fetch(`/api/invites/${params.token}/accept`, { method: 'POST' })
    const data = await res.json()

    if (res.ok) {
      router.push(`/groups/${data.groupId}`)
    } else {
      setError(data.error ?? 'Something went wrong')
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-sm text-stone-400">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="font-serif text-2xl text-stone-900 mb-2">Invite not found</h1>
          <p className="text-sm text-stone-500 mb-6">{error}</p>
          <Link href="/sign-in" className="btn-primary">Go to Travel Kitty</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Left: photo */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1488646953279-85791f67db48?w=1400&auto=format&fit=crop&q=80"
          alt="Travel"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="font-serif text-3xl leading-snug">
            You&apos;re invited to plan something beautiful.
          </p>
        </div>
      </div>

      {/* Right: invite card */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm text-center">
          <p className="label-text mb-4">Travel Kitty</p>

          <h1 className="font-serif text-3xl text-stone-900 mb-2">
            {invite?.groupName}
          </h1>
          <p className="text-sm text-stone-500 mb-8">
            {invite?.memberCount} {invite?.memberCount === 1 ? 'person' : 'people'} planning this trip.
            {!user && ' Create a free account to join them.'}
          </p>

          <button
            onClick={handleJoin}
            disabled={joining}
            className="btn-primary w-full text-base py-3"
          >
            {joining
              ? 'Joining…'
              : user
              ? `Join ${invite?.groupName}`
              : 'Create account & Join'}
          </button>

          {user && (
            <p className="mt-3 text-xs text-stone-400">
              Joining as {user.email}
            </p>
          )}

          {!user && (
            <p className="mt-4 text-sm text-stone-500">
              Already have an account?{' '}
              <Link
                href={`/sign-in?redirect=/invite/${params.token}`}
                className="text-stone-900 hover:underline"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
