import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assignMemberColour } from '@/lib/utils'

type Params = { params: { groupId: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = user.id

  const supabase = createServiceClient()

  const { data: membership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', params.groupId)
    .eq('user_id', userId)
    .single()

  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: members } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', params.groupId)
    .order('joined_at')

  return NextResponse.json({ members: members ?? [] })
}

export async function POST(req: NextRequest, { params }: Params) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = user.id

  const supabase = createServiceClient()

  // Only admin can add members
  const { data: requester } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', params.groupId)
    .eq('user_id', userId)
    .single()

  if (!requester || requester.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 })
  }

  const { email, firstName, colour } = await req.json()
  if (!email?.trim() || !firstName?.trim()) {
    return NextResponse.json({ error: 'Email and first name required' }, { status: 400 })
  }

  // Check if member already exists
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', params.groupId)
    .eq('email', email.trim().toLowerCase())
    .single()

  if (existing) {
    return NextResponse.json({ error: 'This email is already a member' }, { status: 409 })
  }

  // Count existing members to assign colour if not provided
  const { count } = await supabase
    .from('group_members')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', params.groupId)

  const assignedColour = colour ?? assignMemberColour(count ?? 0)

  const { data: member, error } = await supabase
    .from('group_members')
    .insert({
      group_id: params.groupId,
      email: email.trim().toLowerCase(),
      first_name: firstName.trim(),
      colour: assignedColour,
      role: 'member',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }

  return NextResponse.json({ member })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = user.id

  const supabase = createServiceClient()
  const { memberId, colour, firstName } = await req.json()

  const updates: Record<string, string> = {}
  if (colour) updates.colour = colour
  if (firstName) updates.first_name = firstName.trim()

  const { data: member } = await supabase
    .from('group_members')
    .update(updates)
    .eq('id', memberId)
    .eq('group_id', params.groupId)
    .select()
    .single()

  return NextResponse.json({ member })
}
