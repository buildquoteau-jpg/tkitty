import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { analyseAvailability, calculateCost } from '@/lib/anthropic'
import type { CalendarAvailability, GroupMember } from '@/types'

export async function POST(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = user.id

  const { groupId, duration, availability, members } = await req.json()

  if (!groupId || !duration) {
    return NextResponse.json({ error: 'Group ID and duration required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: membership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()

  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Format availability data for Claude
  const memberNames = (members as GroupMember[]).map((m) => m.first_name)
  const memberMap = Object.fromEntries(
    (members as GroupMember[]).map((m) => [m.id, m.first_name])
  )

  const availabilityText = (availability as CalendarAvailability[])
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((a) => `${a.date}, ${memberMap[a.member_id] ?? a.member_id}, ${a.preference}`)
    .join('\n')

  if (!availabilityText) {
    return NextResponse.json({
      result: 'No availability data has been set yet. Ask members to mark their preferred dates on the calendar.',
    })
  }

  try {
    const result = await analyseAvailability(availabilityText, memberNames, duration)

    // Track usage (approximated)
    await supabase.from('ai_usage').insert({
      group_id: groupId,
      feature: 'availability',
      input_tokens: 500,
      output_tokens: 300,
      cost_usd: calculateCost(500, 300),
    })

    return NextResponse.json({ result })
  } catch (err) {
    console.error('Availability analysis error:', err)
    return NextResponse.json(
      { error: 'Failed to analyse availability. Please try again.' },
      { status: 500 }
    )
  }
}
