import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import type { Group, GroupMember } from '@/types'

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { groupId: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const db = createServiceClient()

  const { data: membership } = await db
    .from('group_members')
    .select('id')
    .eq('group_id', params.groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/groups')

  const [{ data: group }, { data: members }, { data: membershipList }] = await Promise.all([
    db.from('groups').select('*').eq('id', params.groupId).single(),
    db.from('group_members').select('*').eq('group_id', params.groupId).order('joined_at'),
    db.from('group_members').select('group_id').eq('user_id', user.id),
  ])

  if (!group) redirect('/groups')

  let allGroups: Group[] = []
  if (membershipList?.length) {
    const groupIds = membershipList.map((m) => m.group_id)
    const { data: groups } = await db.from('groups').select('*').in('id', groupIds).order('name')
    allGroups = (groups ?? []) as Group[]
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar
          group={group as Group}
          members={(members ?? []) as GroupMember[]}
          allGroups={allGroups}
        />
      </div>
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">{children}</main>
      <MobileNav groupId={params.groupId} />
    </div>
  )
}
