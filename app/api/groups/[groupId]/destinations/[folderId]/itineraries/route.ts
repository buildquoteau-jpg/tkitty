import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type Params = { params: { groupId: string; folderId: string } }

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

  const { data: itineraries } = await supabase
    .from('itineraries')
    .select('*')
    .eq('folder_id', params.folderId)
    .order('version', { ascending: true })

  return NextResponse.json({ itineraries: itineraries ?? [] })
}

export async function POST(req: NextRequest, { params }: Params) {
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

  const { content, prompt } = await req.json()
  if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  // Get current version count for this folder
  const { count } = await supabase
    .from('itineraries')
    .select('id', { count: 'exact', head: true })
    .eq('folder_id', params.folderId)

  const version = (count ?? 0) + 1

  const { data: itinerary, error } = await supabase
    .from('itineraries')
    .insert({
      folder_id: params.folderId,
      title: content.title ?? 'Untitled Itinerary',
      version,
      prompt: prompt ?? null,
      content,
      total_cost: content.costEstimate?.total ?? null,
      cost_per_person: content.costEstimate?.perPerson ?? null,
      duration_days: content.duration ?? null,
      created_by: userId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to save itinerary' }, { status: 500 })

  return NextResponse.json({ itinerary })
}
