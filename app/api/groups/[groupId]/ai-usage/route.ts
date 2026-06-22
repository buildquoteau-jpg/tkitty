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

  // This month's usage
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: usage } = await supabase
    .from('ai_usage')
    .select('input_tokens, output_tokens, cost_usd')
    .eq('group_id', params.groupId)
    .gte('created_at', startOfMonth.toISOString())

  const monthly_tokens = (usage ?? []).reduce(
    (sum, u) => sum + u.input_tokens + u.output_tokens,
    0
  )
  const monthly_cost = (usage ?? []).reduce((sum, u) => sum + (u.cost_usd ?? 0), 0)

  return NextResponse.json({ monthly_tokens, monthly_cost })
}
