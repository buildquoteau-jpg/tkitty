import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

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

  const { data: availability } = await supabase
    .from('calendar_availability')
    .select('*')
    .eq('group_id', params.groupId)
    .order('date')

  return NextResponse.json({ availability: availability ?? [] })
}

export async function POST(req: NextRequest, { params }: Params) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = user.id

  const supabase = createServiceClient()

  const { data: member } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', params.groupId)
    .eq('user_id', userId)
    .single()

  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { date, preference } = await req.json()
  if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 })

  if (preference === null) {
    await supabase
      .from('calendar_availability')
      .delete()
      .eq('group_id', params.groupId)
      .eq('member_id', member.id)
      .eq('date', date)
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase.from('calendar_availability').upsert(
    {
      group_id: params.groupId,
      member_id: member.id,
      date,
      preference,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'group_id,member_id,date' }
  )

  if (error) return NextResponse.json({ error: 'Failed to save availability' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
