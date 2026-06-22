'use client'

import { useState, useOptimistic } from 'react'
import type { GroupMember, ItineraryVote } from '@/types'

type Vote = 'love' | 'not_for_me' | null

type Props = {
  itemId: string
  itineraryId: string
  folderId: string
  groupId: string
  currentMemberId: string | null
  votes: ItineraryVote[]
  members: GroupMember[]
}

export default function VotingSystem({
  itemId,
  itineraryId,
  folderId,
  groupId,
  currentMemberId,
  votes,
  members,
}: Props) {
  const [localVotes, setLocalVotes] = useState(votes)
  const [loading, setLoading] = useState(false)

  const currentVote = currentMemberId
    ? localVotes.find((v) => v.item_id === itemId && v.member_id === currentMemberId)?.vote_type ?? null
    : null

  const loveVoters = localVotes.filter((v) => v.item_id === itemId && v.vote_type === 'love')
  const notForMeVoters = localVotes.filter((v) => v.item_id === itemId && v.vote_type === 'not_for_me')

  async function castVote(voteType: Vote) {
    if (!currentMemberId || loading) return

    // Optimistic update
    const newVote: ItineraryVote = {
      id: 'temp',
      itinerary_id: itineraryId,
      item_id: itemId,
      member_id: currentMemberId,
      vote_type: voteType!,
      created_at: new Date().toISOString(),
    }

    if (voteType === null || voteType === currentVote) {
      // Remove vote
      setLocalVotes((prev) => prev.filter((v) => !(v.item_id === itemId && v.member_id === currentMemberId)))
    } else {
      setLocalVotes((prev) => [
        ...prev.filter((v) => !(v.item_id === itemId && v.member_id === currentMemberId)),
        newVote,
      ])
    }

    setLoading(true)
    try {
      await fetch(`/api/groups/${groupId}/destinations/${folderId}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itineraryId,
          itemId,
          voteType: voteType === currentVote ? null : voteType,
        }),
      })
    } catch {
      // Revert on error
      setLocalVotes(votes)
    } finally {
      setLoading(false)
    }
  }

  const getMember = (memberId: string) => members.find((m) => m.id === memberId)

  return (
    <div className="flex items-center gap-4 mt-2">
      {/* Love */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => castVote('love')}
          disabled={!currentMemberId || loading}
          className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
            currentVote === 'love'
              ? 'bg-stone-900 text-white'
              : 'bg-stone-50 text-stone-500 hover:bg-stone-100 hover:text-stone-700'
          } disabled:opacity-40 disabled:cursor-default`}
        >
          Love
        </button>
        {loveVoters.length > 0 && (
          <div className="flex items-center gap-0.5">
            {loveVoters.map((v) => {
              const m = getMember(v.member_id)
              return m ? (
                <span
                  key={v.id}
                  title={m.first_name}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: m.colour }}
                />
              ) : null
            })}
          </div>
        )}
      </div>

      {/* Not for me */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => castVote('not_for_me')}
          disabled={!currentMemberId || loading}
          className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
            currentVote === 'not_for_me'
              ? 'bg-stone-200 text-stone-700'
              : 'bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-600'
          } disabled:opacity-40 disabled:cursor-default`}
        >
          Not for me
        </button>
        {notForMeVoters.length > 0 && (
          <div className="flex items-center gap-0.5">
            {notForMeVoters.map((v) => {
              const m = getMember(v.member_id)
              return m ? (
                <span
                  key={v.id}
                  title={m.first_name}
                  className="w-2 h-2 rounded-full opacity-50"
                  style={{ backgroundColor: m.colour }}
                />
              ) : null
            })}
          </div>
        )}
      </div>
    </div>
  )
}
