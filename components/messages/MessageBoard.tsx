'use client'

import { useState } from 'react'
import { formatRelativeTime, cn } from '@/lib/utils'
import { THREAD_CATEGORIES } from '@/lib/constants'
import type { MessageThread, MessagePost, GroupMember } from '@/types'

type Props = {
  threads: MessageThread[]
  members: GroupMember[]
  currentMemberId: string | null
  onCreateThread: (title: string, category: string) => Promise<void>
  onOpenThread: (thread: MessageThread) => void
}

export default function MessageBoard({
  threads,
  members,
  currentMemberId,
  onCreateThread,
  onOpenThread,
}: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    await onCreateThread(newTitle.trim(), newCategory)
    setNewTitle('')
    setNewCategory('')
    setShowCreate(false)
    setCreating(false)
  }

  const filtered = filter ? threads.filter((t) => t.category === filter) : threads
  const pinned = filtered.filter((t) => t.is_pinned)
  const regular = filtered.filter((t) => !t.is_pinned)

  function getMember(userId: string): GroupMember | undefined {
    return members.find((m) => m.user_id === userId)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setFilter(null)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-lg transition-colors',
              filter === null ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
            )}
          >
            All
          </button>
          {THREAD_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(filter === cat ? null : cat)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-lg transition-colors',
                filter === cat ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-secondary text-xs py-2 px-3 flex-shrink-0">
          New Thread
        </button>
      </div>

      {/* New thread form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="card-padded animate-slide-up">
          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Thread title…"
              className="input-base"
              required
              autoFocus
            />
            <div className="flex gap-2 flex-wrap">
              {THREAD_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewCategory(newCategory === cat ? '' : cat)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg transition-colors border',
                    newCategory === cat
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1 text-xs">
                Cancel
              </button>
              <button type="submit" disabled={creating || !newTitle.trim()} className="btn-primary flex-1 text-xs">
                {creating ? 'Creating…' : 'Create Thread'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Threads */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-stone-300 font-serif text-lg">No threads yet.</p>
          <p className="mt-1 text-sm text-stone-400">Start a discussion about accommodation, food, flights, or anything else.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...pinned, ...regular].map((thread) => {
            const author = getMember(thread.created_by)
            return (
              <button
                key={thread.id}
                onClick={() => onOpenThread(thread)}
                className="w-full text-left card p-5 hover:border-stone-200 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {thread.is_pinned && (
                        <span className="text-[10px] text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded">Pinned</span>
                      )}
                      {thread.category && (
                        <span className="text-[10px] text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded capitalize">
                          {thread.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-stone-800 group-hover:text-stone-900 truncate">
                      {thread.title}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      {author?.first_name ?? 'Unknown'} · {formatRelativeTime(thread.created_at)}
                      {thread.post_count !== undefined && thread.post_count > 0 && (
                        <span className="ml-2">{thread.post_count} repl{thread.post_count === 1 ? 'y' : 'ies'}</span>
                      )}
                    </p>
                  </div>
                  {author && (
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: author.colour }}
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
