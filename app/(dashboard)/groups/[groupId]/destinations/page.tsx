'use client'

import { useState, useEffect } from 'react'
import FolderCard from '@/components/destinations/FolderCard'
import Modal from '@/components/ui/Modal'
import type { DestinationFolder } from '@/types'

export default function DestinationsPage({ params }: { params: { groupId: string } }) {
  const [folders, setFolders] = useState<DestinationFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDest, setNewDest] = useState('')
  const [newDate, setNewDate] = useState('')
  const [creating, setCreating] = useState(false)

  async function loadFolders() {
    const res = await fetch(`/api/groups/${params.groupId}/destinations`)
    const data = await res.json()
    setFolders(data.folders ?? [])
    setLoading(false)
  }

  useEffect(() => { loadFolders() }, [params.groupId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`/api/groups/${params.groupId}/destinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          destination: newDest.trim(),
          targetDate: newDate.trim(),
        }),
      })
      if (res.ok) {
        await loadFolders()
        setShowCreate(false)
        setNewName('')
        setNewDest('')
        setNewDate('')
      }
    } finally {
      setCreating(false)
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
    <div className="px-6 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Destinations</h1>
          <p className="mt-1 text-sm text-stone-400">Your trip folders and itineraries</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          New Folder
        </button>
      </div>

      {folders.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-serif text-xl text-stone-300">No destinations yet.</p>
          <p className="mt-2 text-sm text-stone-400">
            Create a folder to start planning your first trip.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 btn-primary"
          >
            Create First Folder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} groupId={params.groupId} />
          ))}
          <button
            onClick={() => setShowCreate(true)}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 aspect-[4/3] text-stone-400 hover:border-stone-300 hover:text-stone-600 transition-colors"
          >
            <span className="text-sm">New folder</span>
          </button>
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Destination Folder"
      >
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="label-text block mb-1.5">Folder Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Portugal 2027"
              className="input-base"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label-text block mb-1.5">Destination</label>
            <input
              type="text"
              value={newDest}
              onChange={(e) => setNewDest(e.target.value)}
              placeholder="e.g. Lisbon, Porto, Algarve"
              className="input-base"
            />
          </div>
          <div>
            <label className="label-text block mb-1.5">Target Date</label>
            <input
              type="text"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              placeholder="e.g. May 2027"
              className="input-base"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="btn-primary flex-1"
            >
              {creating ? 'Creating…' : 'Create Folder'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
