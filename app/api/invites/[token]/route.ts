import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

type Params = { params: { token: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const db = createServiceClient()

  const { data: invite } = await db
    .from('group_invites')
    .select('*, groups(name, id)')
    .eq('token', params.token)
    .eq('is_active', true)
    .single()

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 })
  }

  // Check expiry
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 })
  }

  // Check use count
  if (invite.use_count >= invite.max_uses) {
    return NextResponse.json({ error: 'This invite link has reached its limit' }, { status: 410 })
  }

  const { count } = await db
    .from('group_members')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', invite.group_id)

  return NextResponse.json({
    groupId: invite.group_id,
    groupName: (invite.groups as { name: string; id: string })?.name,
    memberCount: count ?? 0,
    expiresAt: invite.expires_at,
  })
}
