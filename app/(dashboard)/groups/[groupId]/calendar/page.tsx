'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import GroupCalendar from '@/components/calendar/GroupCalendar'
import type { GroupMember, CalendarAvailability } from '@/types'

export default function CalendarPage({ params }: { params: { groupId: string } }) {
  const { user } = useUser()
  const [members, setMembers] = useState<GroupMember[]>([])
  const [availability, setAvailability] = useState<CalendarAvailability[]>([])
  const [currentMember, setCurrentMember] = useState<GroupMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [findingWindow, setFindingWindow] = useState(false)
  const [windowResult, setWindowResult] = useState<string | null>(null)

  async function loadData() {
    const [membersRes, availRes] = await Promise.all([
      fetch(`/api/groups/${params.groupId}/members`),
      fetch(`/api/groups/${params.groupId}/calendar`),
    ])
    const [membersData, availData] = await Promise.all([membersRes.json(), availRes.json()])
    setMembers(membersData.members ?? [])
    setAvailability(availData.availability ?? [])
    if (user?.id) {
      const m = membersData.members?.find((m: GroupMember) => m.user_id === user.id)
      setCurrentMember(m ?? null)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [params.groupId, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAvailabilityChange(date: string, preference: 'preferred' | 'available' | 'unavailable' | null) {
    if (!currentMember) return
    const res = await fetch(`/api/groups/${params.groupId}/calendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, preference }),
    })
    if (res.ok) {
      // Update local state optimistically
      if (preference === null) {
        setAvailability((prev) => prev.filter((a) => !(a.member_id === currentMember.id && a.date === date)))
      } else {
        setAvailability((prev) => {
          const without = prev.filter((a) => !(a.member_id === currentMember.id && a.date === date))
          return [...without, { id: 'temp', group_id: params.groupId, member_id: currentMember.id, date, preference }]
        })
      }
    }
  }

  async function handleFindBestWindow(duration: number) {
    setFindingWindow(true)
    setWindowResult(null)
    try {
      const res = await fetch('/api/ai/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: params.groupId,
          duration,
          availability,
          members,
        }),
      })
      const data = await res.json()
      setWindowResult(data.result ?? '')
    } finally {
      setFindingWindow(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-stone-400">Loading…</div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-3xl xl:max-w-5xl 2xl:max-w-6xl">
      <div className="mb-8">
        <h1 className="page-title">Calendar</h1>
        <p className="mt-1 text-sm text-stone-400">
          Set your availability and find the best travel window for the group.
        </p>
      </div>

      <GroupCalendar
        groupId={params.groupId}
        members={members}
        availability={availability}
        currentMemberId={currentMember?.id ?? null}
        onAvailabilityChange={handleAvailabilityChange}
        onFindBestWindow={handleFindBestWindow}
        findingWindow={findingWindow}
        windowResult={windowResult}
      />
    </div>
  )
}
