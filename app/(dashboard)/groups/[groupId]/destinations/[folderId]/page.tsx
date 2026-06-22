'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import AISearchBar from '@/components/destinations/AISearchBar'
import ItineraryDisplay from '@/components/destinations/ItineraryDisplay'
import Modal from '@/components/ui/Modal'
import LoadingDots from '@/components/ui/LoadingDots'
import { getDestinationPhoto } from '@/lib/constants'
import type { DestinationFolder, Itinerary, ItineraryContent, GroupMember, ItineraryVote } from '@/types'

type Props = { params: { groupId: string; folderId: string } }

export default function FolderPage({ params }: Props) {
  const { user } = useUser()
  const [folder, setFolder] = useState<DestinationFolder | null>(null)
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [activeItineraryId, setActiveItineraryId] = useState<string | null>(null)
  const [votes, setVotes] = useState<ItineraryVote[]>([])
  const [members, setMembers] = useState<GroupMember[]>([])
  const [currentMember, setCurrentMember] = useState<GroupMember | null>(null)
  const [newItinerary, setNewItinerary] = useState<ItineraryContent | null>(null)
  const [newPrompt, setNewPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'itineraries' | 'notes' | 'images'>('itineraries')
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [totalSavings, setTotalSavings] = useState(0)

  async function loadData() {
    const [folderRes, itinRes, membersRes, ledgerRes] = await Promise.all([
      fetch(`/api/groups/${params.groupId}/destinations/${params.folderId}`),
      fetch(`/api/groups/${params.groupId}/destinations/${params.folderId}/itineraries`),
      fetch(`/api/groups/${params.groupId}/members`),
      fetch(`/api/groups/${params.groupId}/ledger`),
    ])
    const [folderData, itinData, membersData, ledgerData] = await Promise.all([
      folderRes.json(),
      itinRes.json(),
      membersRes.json(),
      ledgerRes.json(),
    ])
    setFolder(folderData.folder)
    setItineraries(itinData.itineraries ?? [])
    setActiveItineraryId(itinData.itineraries?.[0]?.id ?? null)
    setMembers(membersData.members ?? [])
    setNotes(folderData.notes ?? '')
    setTotalSavings((ledgerData.travelFund ?? 0) + (ledgerData.interestFund ?? 0))

    if (user?.id) {
      const member = membersData.members?.find((m: GroupMember) => m.user_id === user.id)
      setCurrentMember(member ?? null)
    }

    // Load votes for active itinerary
    if (itinData.itineraries?.[0]?.id) {
      loadVotes(itinData.itineraries[0].id)
    }
    setLoading(false)
  }

  async function loadVotes(itineraryId: string) {
    const res = await fetch(
      `/api/groups/${params.groupId}/destinations/${params.folderId}/votes?itineraryId=${itineraryId}`
    )
    const data = await res.json()
    setVotes(data.votes ?? [])
  }

  useEffect(() => { loadData() }, [params.folderId, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAIResult(content: ItineraryContent, prompt: string) {
    setNewItinerary(content)
    setNewPrompt(prompt)
    setTab('itineraries')
  }

  async function saveItinerary() {
    if (!newItinerary) return
    setSaving(true)
    try {
      const res = await fetch(
        `/api/groups/${params.groupId}/destinations/${params.folderId}/itineraries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newItinerary, prompt: newPrompt }),
        }
      )
      if (res.ok) {
        const data = await res.json()
        setItineraries((prev) => [...prev, data.itinerary])
        setActiveItineraryId(data.itinerary.id)
        setNewItinerary(null)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleVersionSelect(id: string) {
    setActiveItineraryId(id)
    setNewItinerary(null)
    await loadVotes(id)
  }

  async function saveNotes() {
    setSavingNotes(true)
    await fetch(`/api/groups/${params.groupId}/destinations/${params.folderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    setSavingNotes(false)
  }

  if (loading || !folder) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-stone-400">Loading…</div>
      </div>
    )
  }

  const photo = folder.cover_image_url
    ? { url: folder.cover_image_url }
    : getDestinationPhoto(folder.destination ?? folder.name)

  const activeItinerary = itineraries.find((i) => i.id === activeItineraryId) ?? null

  return (
    <div>
      {/* Hero header */}
      <div className="relative h-48 bg-stone-900 overflow-hidden">
        <img
          src={photo.url}
          alt={folder.name}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6">
          <p className="text-white/60 text-xs mb-1">{folder.target_date}</p>
          <h1 className="font-serif text-2xl text-white">{folder.name}</h1>
        </div>
      </div>

      <div className="px-6 py-6 max-w-5xl xl:max-w-7xl 2xl:max-w-[1400px]">
        {/* AI Search */}
        <div className="mb-6">
          <AISearchBar
            groupId={params.groupId}
            folderId={params.folderId}
            groupSize={members.length || 9}
            onResult={handleAIResult}
          />
        </div>

        {/* New itinerary preview */}
        {newItinerary && (
          <div className="mb-6 bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-stone-400 animate-pulse" />
                <p className="text-sm text-stone-600">New itinerary generated</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewItinerary(null)}
                  className="btn-ghost text-xs py-1"
                >
                  Discard
                </button>
                <button
                  onClick={saveItinerary}
                  disabled={saving}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  {saving ? 'Saving…' : 'Save to folder'}
                </button>
              </div>
            </div>
            <div className="p-5">
              <ItineraryDisplay
                itinerary={{
                  id: 'preview',
                  folder_id: params.folderId,
                  title: newItinerary.title,
                  version: (itineraries.length ?? 0) + 1,
                  prompt: newPrompt,
                  content: newItinerary,
                  total_cost: newItinerary.costEstimate.total,
                  cost_per_person: newItinerary.costEstimate.perPerson,
                  duration_days: newItinerary.duration,
                  created_by: user?.id ?? '',
                  created_at: new Date().toISOString(),
                }}
                versions={[]}
                onVersionSelect={() => {}}
                votes={[]}
                members={members}
                currentMemberId={currentMember?.id ?? null}
                groupId={params.groupId}
                currentSavings={totalSavings}
                onSaveToFolder={saveItinerary}
                isSaved={false}
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-6 border-b border-stone-100 mb-6">
          {(['itineraries', 'notes', 'images'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm capitalize transition-colors ${
                tab === t
                  ? 'text-stone-900 font-medium border-b-2 border-stone-900 -mb-px'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'itineraries' && (
          <div>
            {itineraries.length === 0 && !newItinerary ? (
              <div className="text-center py-16">
                <p className="text-stone-300 font-serif text-xl">No itineraries yet.</p>
                <p className="mt-2 text-sm text-stone-400">
                  Use the search bar above to generate your first itinerary.
                </p>
              </div>
            ) : (
              activeItinerary && (
                <ItineraryDisplay
                  itinerary={activeItinerary}
                  versions={itineraries}
                  onVersionSelect={handleVersionSelect}
                  votes={votes}
                  members={members}
                  currentMemberId={currentMember?.id ?? null}
                  groupId={params.groupId}
                  currentSavings={totalSavings}
                  onSaveToFolder={() => {}}
                  isSaved={true}
                  folderId={params.folderId}
                />
              )
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div className="max-w-2xl">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for this destination — accommodation ideas, restaurants to try, things to consider…"
              rows={12}
              className="input-base resize-none leading-relaxed"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="btn-primary text-xs py-2 px-4"
              >
                {savingNotes ? 'Saving…' : 'Save Notes'}
              </button>
            </div>
          </div>
        )}

        {tab === 'images' && (
          <div>
            <p className="text-sm text-stone-400">
              Image gallery coming soon — add destination photos to inspire your group.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
