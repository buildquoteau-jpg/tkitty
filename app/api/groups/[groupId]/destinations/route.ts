import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getDestinationPhoto } from '@/lib/constants'

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

  const { data: folders } = await supabase
    .from('destination_folders')
    .select('*')
    .eq('group_id', params.groupId)
    .order('created_at', { ascending: false })

  // Enrich with itinerary counts
  const enriched = await Promise.all(
    (folders ?? []).map(async (folder) => {
      const { count } = await supabase
        .from('itineraries')
        .select('id', { count: 'exact', head: true })
        .eq('folder_id', folder.id)
      return { ...folder, itinerary_count: count ?? 0 }
    })
  )

  return NextResponse.json({ folders: enriched })
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

  const { name, destination, country, targetDate } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const dest = destination?.trim() || name.trim()
  const photo = getDestinationPhoto(dest)

  const { data: folder, error } = await supabase
    .from('destination_folders')
    .insert({
      group_id: params.groupId,
      name: name.trim(),
      destination: dest,
      country: country?.trim() ?? null,
      cover_image_url: photo.url,
      cover_image_credit: photo.credit,
      target_date: targetDate?.trim() ?? null,
      created_by: userId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })

  return NextResponse.json({ folder })
}
