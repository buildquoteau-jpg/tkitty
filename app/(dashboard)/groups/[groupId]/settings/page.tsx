'use client'

import { useState, useEffect } from 'react'
import { MEMBER_COLOURS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import type { Group, GroupMember } from '@/types'

type Invite = { id: string; token: string; use_count: number; max_uses: number; expires_at: string | null; created_at: string }

export default function SettingsPage({ params }: { params: { groupId: string } }) {
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [groupName, setGroupName] = useState('')
  const [saving, setSaving] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteFirstName, setInviteFirstName] = useState('')
  const [invites, setInvites] = useState<Invite[]>([])
  const [generatingLink, setGeneratingLink] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [inviteColour, setInviteColour] = useState(MEMBER_COLOURS[2].value)
  const [inviting, setInviting] = useState(false)
  const [aiUsage, setAiUsage] = useState({ monthly_cost: 0, monthly_tokens: 0 })
  const [tab, setTab] = useState<'general' | 'members' | 'invite' | 'ai'>('general')

  async function loadData() {
    const [groupRes, membersRes, aiRes, invitesRes] = await Promise.all([
      fetch(`/api/groups/${params.groupId}`),
      fetch(`/api/groups/${params.groupId}/members`),
      fetch(`/api/groups/${params.groupId}/ai-usage`),
      fetch(`/api/groups/${params.groupId}/invites`),
    ])
    const [groupData, membersData] = await Promise.all([groupRes.json(), membersRes.json()])
    setGroup(groupData.group)
    setGroupName(groupData.group?.name ?? '')
    setMembers(membersData.members ?? [])
    if (aiRes.ok) {
      const aiData = await aiRes.json()
      setAiUsage(aiData)
    }
    if (invitesRes.ok) {
      const invData = await invitesRes.json()
      setInvites(invData.invites ?? [])
    }
    setLoading(false)
  }

  async function generateInviteLink() {
    setGeneratingLink(true)
    const res = await fetch(`/api/groups/${params.groupId}/invites`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setInvites((prev) => [data.invite, ...prev])
    }
    setGeneratingLink(false)
  }

  function getInviteUrl(token: string) {
    return `${window.location.origin}/invite/${token}`
  }

  async function copyLink(invite: Invite) {
    await navigator.clipboard.writeText(getInviteUrl(invite.token))
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function shareViaWhatsApp(invite: Invite) {
    const url = getInviteUrl(invite.token)
    const message = `You're invited to join "${group?.name}" on Travel Kitty — our shared travel planning space.\n\nClick here to join: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  async function revokeInvite(inviteId: string) {
    await fetch(`/api/groups/${params.groupId}/invites`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId }),
    })
    setInvites((prev) => prev.filter((i) => i.id !== inviteId))
  }

  useEffect(() => { loadData() }, [params.groupId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveGroup(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/groups/${params.groupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName }),
    })
    setSaving(false)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim() || !inviteFirstName.trim()) return
    setInviting(true)
    const res = await fetch(`/api/groups/${params.groupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail.trim(),
        firstName: inviteFirstName.trim(),
        colour: inviteColour,
      }),
    })
    if (res.ok) {
      await loadData()
      setInviteEmail('')
      setInviteFirstName('')
    }
    setInviting(false)
  }

  if (loading || !group) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-stone-400">Loading…</div>
      </div>
    )
  }

  const usedColours = members.map((m) => m.colour)
  const availableColours = MEMBER_COLOURS.filter((c) => !usedColours.includes(c.value))

  return (
    <div className="px-6 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="page-title">Settings</h1>
        <p className="mt-1 text-sm text-stone-400">{group.name}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-stone-100 mb-6">
        {(['general', 'members', 'invite', 'ai'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm capitalize transition-colors ${
              tab === t
                ? 'text-stone-900 font-medium border-b-2 border-stone-900 -mb-px'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            {t === 'ai' ? 'AI Usage' : t}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <form onSubmit={handleSaveGroup} className="card-padded space-y-4">
          <div>
            <label className="label-text block mb-1.5">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="input-base"
              required
            />
          </div>
          <button type="submit" disabled={saving || !groupName.trim()} className="btn-primary">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      )}

      {tab === 'members' && (
        <div className="space-y-5">
          {/* Current members */}
          <div className="card-padded">
            <h2 className="section-title mb-4">Members</h2>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: member.colour }}
                    />
                    <div>
                      <p className="text-sm text-stone-800">{member.first_name}</p>
                      <p className="text-xs text-stone-400">{member.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-stone-400 capitalize">{member.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Invite new member */}
          <div className="card-padded">
            <h2 className="section-title mb-4">Add Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text block mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    placeholder="e.g. Sarah"
                    className="input-base"
                    required
                  />
                </div>
                <div>
                  <label className="label-text block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    className="input-base"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label-text block mb-2">Colour</label>
                <div className="flex gap-2 flex-wrap">
                  {MEMBER_COLOURS.map((colour) => (
                    <button
                      key={colour.value}
                      type="button"
                      title={colour.name}
                      onClick={() => setInviteColour(colour.value)}
                      disabled={usedColours.includes(colour.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        inviteColour === colour.value
                          ? 'border-stone-900 ring-2 ring-stone-300'
                          : 'border-white ring-1 ring-stone-200 hover:ring-stone-400'
                      } ${usedColours.includes(colour.value) ? 'opacity-30 cursor-not-allowed' : ''}`}
                      style={{ backgroundColor: colour.value }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim() || !inviteFirstName.trim()}
                className="btn-primary w-full"
              >
                {inviting ? 'Adding…' : 'Add Member'}
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'invite' && (
        <div className="space-y-5">
          <div className="card-padded">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="section-title">Invite via WhatsApp</h2>
                <p className="text-xs text-stone-400 mt-1">
                  Generate a link and share it with friends. Anyone with the link can join.
                </p>
              </div>
              <button
                onClick={generateInviteLink}
                disabled={generatingLink}
                className="btn-primary text-xs py-2 px-3 flex-shrink-0"
              >
                {generatingLink ? 'Generating…' : 'Generate Link'}
              </button>
            </div>

            {invites.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-6">
                No active invite links. Generate one above.
              </p>
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div key={invite.id} className="bg-stone-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <code className="text-xs text-stone-500 bg-white border border-stone-200 rounded-lg px-2 py-1 flex-1 truncate">
                        {getInviteUrl(invite.token)}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => shareViaWhatsApp(invite)}
                        className="flex-1 bg-[#25D366] text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-[#20bd5a] transition-colors"
                      >
                        Share via WhatsApp
                      </button>
                      <button
                        onClick={() => copyLink(invite)}
                        className="btn-secondary text-xs py-2 px-3"
                      >
                        {copiedId === invite.id ? 'Copied!' : 'Copy link'}
                      </button>
                      <button
                        onClick={() => revokeInvite(invite.id)}
                        className="text-xs text-stone-400 hover:text-red-500 transition-colors px-2"
                      >
                        Revoke
                      </button>
                    </div>
                    <p className="text-xs text-stone-400 mt-2">
                      Used {invite.use_count} / {invite.max_uses} times
                      {invite.expires_at && ` · Expires ${new Date(invite.expires_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'ai' && (
        <div className="space-y-5">
          <div className="card-padded">
            <h2 className="section-title mb-4">This Month&apos;s AI Usage</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="label-text mb-1">Estimated Cost</p>
                <p className="font-serif text-2xl text-stone-900">
                  {formatCurrency(aiUsage.monthly_cost, 'USD').replace('A', 'US')}
                </p>
              </div>
              <div>
                <p className="label-text mb-1">Tokens Used</p>
                <p className="font-serif text-2xl text-stone-900">
                  {aiUsage.monthly_tokens.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="card-padded bg-stone-50">
            <p className="text-sm text-stone-600 leading-relaxed">
              AI costs can be covered from the group&apos;s shared interest fund. This is a group decision —
              Travel Kitty never automatically moves money. Record the allocation manually in your ledger
              when the group agrees.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
