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

  const { data: threads } = await supabase
    .from('message_threads')
    .select('*')
    .eq('group_id', params.groupId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  // Enrich with post counts
  const enriched = await Promise.all(
    (threads ?? []).map(async (thread) => {
      const { count } = await supabase
        .from('message_posts')
        .select('id', { count: 'exact', head: true })
        .eq('thread_id', thread.id)
      return { ...thread, post_count: count ?? 0 }
    })
  )

  return NextResponse.json({ threads: enriched })
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

  const { title, category, folderId } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const { data: thread, error } = await supabase
    .from('message_threads')
    .insert({
      group_id: params.groupId,
      folder_id: folderId ?? null,
      title: title.trim(),
      category: category ?? null,
      created_by: userId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 })

  return NextResponse.json({ thread })
}
