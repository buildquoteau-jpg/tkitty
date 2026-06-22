import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Group } from '@/types'

export default async function GroupsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const db = createServiceClient()
  const { data: memberships } = await db
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  let groups: Group[] = []
  if (memberships?.length) {
    const groupIds = memberships.map((m) => m.group_id)
    const { data } = await db.from('groups').select('*').in('id', groupIds).order('created_at', { ascending: false })
    groups = (data ?? []) as Group[]
  }

  if (groups.length === 1) redirect(`/groups/${groups[0].id}`)

  const firstName = user.user_metadata?.first_name ?? user.email?.split('@')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="font-serif text-3xl text-stone-900">Hello, {firstName}.</h1>
          <p className="mt-2 text-stone-500 text-sm">
            {groups.length === 0
              ? 'Create your first travel group to get started.'
              : 'Choose a group to continue planning.'}
          </p>
        </div>

        {groups.length > 0 && (
          <div className="space-y-3 mb-8">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}

        <Link
          href="/groups/new"
          className="block w-full text-center py-4 border-2 border-dashed border-stone-200 rounded-2xl text-sm text-stone-400 hover:border-stone-300 hover:text-stone-600 transition-colors"
        >
          Create a new group
        </Link>
      </div>
    </div>
  )
}

async function GroupCard({ group }: { group: Group }) {
  const db = createServiceClient()
  const { data: members } = await db
    .from('group_members')
    .select('first_name, colour')
    .eq('group_id', group.id)

  return (
    <Link
      href={`/groups/${group.id}`}
      className="block bg-white border border-stone-100 rounded-2xl p-6 hover:border-stone-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-serif text-lg text-stone-900">{group.name}</h2>
          <p className="mt-1 text-xs text-stone-400">
            {members?.length ?? 0} member{(members?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="text-stone-300 text-lg">→</span>
      </div>
      {members && members.length > 0 && (
        <div className="mt-4 flex items-center gap-1.5">
          {members.map((m, i) => (
            <span key={i} title={m.first_name} className="member-dot" style={{ backgroundColor: m.colour }} />
          ))}
        </div>
      )}
    </Link>
  )
}
