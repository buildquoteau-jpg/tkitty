import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type Params = { params: { groupId: string } }

async function verifyMember(userId: string, groupId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('group_members')
    .select('id, role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()
  return data
}

export async function GET(_req: NextRequest, { params }: Params) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = user.id

  const membership = await verifyMember(userId, params.groupId)
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', params.groupId)
    .single()

  return NextResponse.json({ group })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = user.id

  const membership = await verifyMember(userId, params.groupId)
  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const supabase = createServiceClient()

  const updates: Record<string, unknown> = {}
  if (body.name) updates.name = body.name.trim()
  if (body.ai_monthly_budget !== undefined) updates.ai_monthly_budget = body.ai_monthly_budget

  const { data: group } = await supabase
    .from('groups')
    .update(updates)
    .eq('id', params.groupId)
    .select()
    .single()

  return NextResponse.json({ group })
}
