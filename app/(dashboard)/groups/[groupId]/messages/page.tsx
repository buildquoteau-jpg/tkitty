'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import MessageBoard from '@/components/messages/MessageBoard'
import type { MessageThread, MessagePost, GroupMember } from '@/types'
import { formatRelativeTime } from '@/lib/utils'

export default function MessagesPage({ params }: { params: { groupId: string } }) {
  const { user } = useUser()
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [members, setMembers] = useState<GroupMember[]>([])
  const [currentMember, setCurrentMember] = useState<GroupMember | null>(null)
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null)
  const [posts, setPosts] = useState<MessagePost[]>([])
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(true)
  const postsEndRef = useRef<HTMLDivElement>(null)

  async function loadData() {
    const [threadsRes, membersRes] = await Promise.all([
      fetch(`/api/groups/${params.groupId}/messages`),
      fetch(`/api/groups/${params.groupId}/members`),
    ])
    const [threadsData, membersData] = await Promise.all([threadsRes.json(), membersRes.json()])
    setThreads(threadsData.threads ?? [])
    setMembers(membersData.members ?? [])
    if (user?.id) {
      const m = membersData.members?.find((m: GroupMember) => m.user_id === user.id)
      setCurrentMember(m ?? null)
    }
    setLoading(false)
  }

  async function loadPosts(threadId: string) {
    const res = await fetch(`/api/groups/${params.groupId}/messages/${threadId}`)
    const data = await res.json()
    setPosts(data.posts ?? [])
    setTimeout(() => postsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  useEffect(() => { loadData() }, [params.groupId, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreateThread(title: string, category: string) {
    const res = await fetch(`/api/groups/${params.groupId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category }),
    })
    if (res.ok) {
      await loadData()
    }
  }

  async function handleOpenThread(thread: MessageThread) {
    setActiveThread(thread)
    await loadPosts(thread.id)
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!newPost.trim() || !activeThread) return
    setPosting(true)
    const res = await fetch(`/api/groups/${params.groupId}/messages/${activeThread.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newPost.trim() }),
    })
    if (res.ok) {
      await loadPosts(activeThread.id)
      setNewPost('')
    }
    setPosting(false)
  }

  function getMember(userId: string): GroupMember | undefined {
    return members.find((m) => m.user_id === userId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-stone-400">Loading…</div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
      <div className="mb-8">
        <h1 className="page-title">Messages</h1>
        <p className="mt-1 text-sm text-stone-400">
          Group discussions organised by topic
        </p>
      </div>

      {activeThread ? (
        <div>
          <button
            onClick={() => setActiveThread(null)}
            className="btn-ghost text-xs py-1.5 mb-5 -ml-2"
          >
            ← All threads
          </button>

          <div className="mb-5">
            <h2 className="font-serif text-xl text-stone-900">{activeThread.title}</h2>
            {activeThread.category && (
              <p className="text-xs text-stone-400 mt-1 capitalize">{activeThread.category}</p>
            )}
          </div>

          {/* Posts */}
          <div className="space-y-4 mb-6">
            {posts.length === 0 ? (
              <p className="text-sm text-stone-400">No replies yet. Be the first to respond.</p>
            ) : (
              posts.map((post) => {
                const author = getMember(post.created_by)
                const isMe = post.created_by === user?.id
                return (
                  <div key={post.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className="flex-shrink-0 mt-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full block"
                        style={{ backgroundColor: author?.colour ?? '#a8a29e' }}
                      />
                    </div>
                    <div className={`max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isMe ? 'bg-stone-900 text-white rounded-tr-sm' : 'bg-stone-50 text-stone-800 rounded-tl-sm'
                      }`}>
                        {post.content}
                      </div>
                      <p className="text-xs text-stone-400 mt-1.5 px-1">
                        {author?.first_name} · {formatRelativeTime(post.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={postsEndRef} />
          </div>

          {/* Reply input */}
          {currentMember && (
            <form onSubmit={handlePost} className="flex gap-3">
              <div className="flex-shrink-0 mt-3">
                <span
                  className="w-2.5 h-2.5 rounded-full block"
                  style={{ backgroundColor: currentMember.colour }}
                />
              </div>
              <div className="flex-1 flex gap-2">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost(e)
                  }}
                  placeholder="Write a reply…"
                  rows={2}
                  className="input-base resize-none leading-relaxed flex-1"
                />
                <button
                  type="submit"
                  disabled={posting || !newPost.trim()}
                  className="btn-primary self-end"
                >
                  {posting ? '…' : 'Send'}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <MessageBoard
          threads={threads}
          members={members}
          currentMemberId={currentMember?.id ?? null}
          onCreateThread={handleCreateThread}
          onOpenThread={handleOpenThread}
        />
      )}
    </div>
  )
}
