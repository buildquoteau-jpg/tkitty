import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

type Params = { params: { groupId: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const db = createServiceClient()

  const { data: membership } = await db
    .from('group_members')
    .select('role')
    .eq('group_id', params.groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: invites } = await db
    .from('group_invites')
    .select('*')
    .eq('group_id', params.groupId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return NextResponse.json({ invites: invites ?? [] })
}

export async function POST(_req: NextRequest, { params }: Params) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const db = createServiceClient()

  const { data: membership } = await db
    .from('group_members')
    .select('role')
    .eq('group_id', params.groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can create invite links' }, { status: 403 })
  }

  const token = randomBytes(16).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // 30 day expiry

  const { data: invite, error } = await db
    .from('group_invites')
    .insert({
      group_id: params.groupId,
      token,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })

  return NextResponse.json({ invite })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { inviteId } = await req.json()
  const db = createServiceClient()

  await db
    .from('group_invites')
    .update({ is_active: false })
    .eq('id', inviteId)
    .eq('group_id', params.groupId)

  return NextResponse.json({ ok: true })
}
