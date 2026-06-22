import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assignMemberColour } from '@/lib/utils'

type Params = { params: { token: string } }

export async function POST(_req: NextRequest, { params }: Params) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const db = createServiceClient()

  // Validate invite
  const { data: invite } = await db
    .from('group_invites')
    .select('*')
    .eq('token', params.token)
    .eq('is_active', true)
    .single()

  if (!invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
  }
  if (invite.use_count >= invite.max_uses) {
    return NextResponse.json({ error: 'Invite limit reached' }, { status: 410 })
  }

  // Check if already a member
  const { data: existing } = await db
    .from('group_members')
    .select('id')
    .eq('group_id', invite.group_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ groupId: invite.group_id, alreadyMember: true })
  }

  // Get member count for colour assignment
  const { count } = await db
    .from('group_members')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', invite.group_id)

  const colour = assignMemberColour(count ?? 0)
  const firstName = user.user_metadata?.first_name ?? user.email?.split('@')[0] ?? 'Friend'

  // Add to group
  const { error } = await db.from('group_members').insert({
    group_id: invite.group_id,
    user_id: user.id,
    first_name: firstName,
    email: user.email ?? '',
    colour,
    role: 'member',
  })

  if (error) return NextResponse.json({ error: 'Failed to join group' }, { status: 500 })

  // Increment use count
  await db
    .from('group_invites')
    .update({ use_count: (invite.use_count ?? 0) + 1 })
    .eq('id', invite.id)

  return NextResponse.json({ groupId: invite.group_id })
}
