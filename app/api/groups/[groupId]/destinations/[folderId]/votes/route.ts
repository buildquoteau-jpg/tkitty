import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type Params = { params: { groupId: string; folderId: string } }

export async function GET(req: NextRequest, { params }: Params) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = user.id

  const supabase = createServiceClient()
  const itineraryId = req.nextUrl.searchParams.get('itineraryId')
  if (!itineraryId) return NextResponse.json({ votes: [] })

  const { data: votes } = await supabase
    .from('itinerary_votes')
    .select('*, group_members(first_name, colour, user_id)')
    .eq('itinerary_id', itineraryId)

  return NextResponse.json({ votes: votes ?? [] })
}

export async function POST(req: NextRequest, { params }: Params) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = user.id

  const supabase = createServiceClient()

  // Get current member
  const { data: member } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', params.groupId)
    .eq('user_id', userId)
    .single()

  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { itineraryId, itemId, voteType } = await req.json()

  if (voteType === null) {
    // Remove vote
    await supabase
      .from('itinerary_votes')
      .delete()
      .eq('itinerary_id', itineraryId)
      .eq('item_id', itemId)
      .eq('member_id', member.id)
    return NextResponse.json({ ok: true })
  }

  // Upsert vote
  const { error } = await supabase.from('itinerary_votes').upsert(
    {
      itinerary_id: itineraryId,
      item_id: itemId,
      member_id: member.id,
      vote_type: voteType,
    },
    { onConflict: 'itinerary_id,item_id,member_id' }
  )

  if (error) return NextResponse.json({ error: 'Failed to save vote' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
