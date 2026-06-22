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

  const [{ data: folder }, { data: note }] = await Promise.all([
    supabase
      .from('destination_folders')
      .select('*')
      .eq('id', params.folderId)
      .eq('group_id', params.groupId)
      .single(),
    supabase
      .from('folder_notes')
      .select('content')
      .eq('folder_id', params.folderId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ folder, notes: note?.content ?? '' })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = user.id

  const supabase = createServiceClient()
  const body = await req.json()

  if (body.notes !== undefined) {
    // Upsert note
    const { data: existingNote } = await supabase
      .from('folder_notes')
      .select('id')
      .eq('folder_id', params.folderId)
      .order('created_at')
      .limit(1)
      .single()

    if (existingNote) {
      await supabase
        .from('folder_notes')
        .update({ content: body.notes, updated_at: new Date().toISOString() })
        .eq('id', existingNote.id)
    } else {
      await supabase.from('folder_notes').insert({
        folder_id: params.folderId,
        content: body.notes,
        created_by: userId,
      })
    }
    return NextResponse.json({ ok: true })
  }

  const updates: Record<string, unknown> = {}
  if (body.name) updates.name = body.name.trim()
  if (body.targetDate !== undefined) updates.target_date = body.targetDate
  if (body.coverImageUrl !== undefined) updates.cover_image_url = body.coverImageUrl

  const { data: folder } = await supabase
    .from('destination_folders')
    .update(updates)
    .eq('id', params.folderId)
    .eq('group_id', params.groupId)
    .select()
    .single()

  return NextResponse.json({ folder })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = user.id

  const supabase = createServiceClient()

  // Only admin can delete folders
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', params.groupId)
    .eq('user_id', userId)
    .single()

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await supabase
    .from('destination_folders')
    .delete()
    .eq('id', params.folderId)
    .eq('group_id', params.groupId)

  return NextResponse.json({ ok: true })
}
