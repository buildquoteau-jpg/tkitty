'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MEMBER_COLOURS } from '@/lib/constants'

export default function NewGroupPage() {
  const router = useRouter()
  const [groupName, setGroupName] = useState('')
  const [myFirstName, setMyFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.first_name) {
        setMyFirstName(user.user_metadata.first_name)
      }
    })
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!groupName.trim() || !myFirstName.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          adminFirstName: myFirstName.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create group')
      }

      const { groupId } = await res.json()
      router.push(`/groups/${groupId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white border border-stone-100 rounded-2xl p-8">
          <h1 className="font-serif text-2xl text-stone-900 mb-2">New Travel Group</h1>
          <p className="text-sm text-stone-500 mb-8">
            Create a shared space for your group&apos;s travel planning and savings.
          </p>

          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="label-text block mb-1.5">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Portugal Girls 2027"
                className="input-base"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label-text block mb-1.5">Your First Name</label>
              <input
                type="text"
                value={myFirstName}
                onChange={(e) => setMyFirstName(e.target.value)}
                placeholder="e.g. Melia"
                className="input-base"
                required
              />
            </div>

            <div>
              <label className="label-text block mb-2">Your Colour</label>
              <div className="flex gap-2 flex-wrap">
                {MEMBER_COLOURS.map((colour) => (
                  <span
                    key={colour.value}
                    title={colour.name}
                    className="w-7 h-7 rounded-full border-2 border-white ring-1 ring-stone-200"
                    style={{ backgroundColor: colour.value }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !groupName.trim() || !myFirstName.trim()}
                className="btn-primary flex-1"
              >
                {loading ? 'Creating…' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
