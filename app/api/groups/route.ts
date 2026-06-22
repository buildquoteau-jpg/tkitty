import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { MEMBER_COLOURS } from '@/lib/constants'

export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = user.id

  const db = createServiceClient()
  const { data: memberships } = await db
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)

  if (!memberships?.length) {
    return NextResponse.json({ groups: [] })
  }

  const groupIds = memberships.map((m) => m.group_id)
  const { data: groups } = await db
    .from('groups')
    .select('*')
    .in('id', groupIds)
    .order('created_at', { ascending: false })

  return NextResponse.json({ groups: groups ?? [] })
}

export async function POST(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = user.id

  const { name, adminFirstName, adminEmail } = await req.json()
  if (!name?.trim() || !adminFirstName?.trim()) {
    return NextResponse.json({ error: 'Name and first name required' }, { status: 400 })
  }

  const db = createServiceClient()

  const { data: group, error: groupError } = await db
    .from('groups')
    .insert({ name: name.trim(), created_by: userId })
    .select()
    .single()

  if (groupError || !group) {
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }

  const { error: memberError } = await db.from('group_members').insert({
    group_id: group.id,
    user_id: userId,
    first_name: adminFirstName.trim(),
    email: adminEmail ?? '',
    colour: MEMBER_COLOURS[0].value,
    role: 'admin',
  })

  if (memberError) {
    await db.from('groups').delete().eq('id', group.id)
    return NextResponse.json({ error: 'Failed to set up group' }, { status: 500 })
  }

  return NextResponse.json({ groupId: group.id })
}
