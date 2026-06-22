import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateItinerary, calculateCost } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const userId = user.id

  const { prompt, groupId, groupSize } = await req.json()

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
  }

  if (!groupId) {
    return NextResponse.json({ error: 'Group ID required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verify membership
  const { data: membership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()

  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { content, inputTokens, outputTokens } = await generateItinerary(
      prompt,
      groupSize ?? 9
    )

    // Track usage
    const cost = calculateCost(inputTokens, outputTokens)
    await supabase.from('ai_usage').insert({
      group_id: groupId,
      feature: 'itinerary',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: cost,
    })

    return NextResponse.json({ content, tokensUsed: inputTokens + outputTokens })
  } catch (err) {
    console.error('Itinerary generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate itinerary. Please try again.' },
      { status: 500 }
    )
  }
}
