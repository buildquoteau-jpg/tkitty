import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { parseStatement, calculateCost } from '@/lib/anthropic'

type Params = { params: { groupId: string } }

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

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Get member names for context
  const { data: members } = await supabase
    .from('group_members')
    .select('first_name')
    .eq('group_id', params.groupId)

  const memberNames = (members ?? []).map((m) => m.first_name)

  let rawText = ''

  if (file.type === 'text/csv' || file.name.endsWith('.csv') || file.type === 'text/plain') {
    rawText = await file.text()
  } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    // For PDF, extract text — we'll use the raw bytes as text (works for text-based PDFs)
    // In production, integrate a proper PDF parser like pdf-parse
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    // Simple text extraction — try to get readable content
    rawText = Buffer.from(bytes).toString('utf-8').replace(/[^\x20-\x7E\n\t]/g, ' ')
    // Fallback: if the extracted text is garbage, return an error
    if (rawText.replace(/\s/g, '').length < 50) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF. Please use a CSV export from your bank instead.' },
        { status: 422 }
      )
    }
  } else {
    rawText = await file.text()
  }

  if (!rawText.trim()) {
    return NextResponse.json({ error: 'File appears to be empty' }, { status: 400 })
  }

  try {
    const { entries, inputTokens, outputTokens } = await parseStatement(rawText, memberNames)

    // Track AI usage
    const cost = calculateCost(inputTokens, outputTokens)
    await supabase.from('ai_usage').insert({
      group_id: params.groupId,
      feature: 'statement_parse',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: cost,
    })

    return NextResponse.json({ entries, tokensUsed: inputTokens + outputTokens })
  } catch (err) {
    console.error('Statement parse error:', err)
    return NextResponse.json(
      { error: 'Failed to analyse statement. Please check the file format.' },
      { status: 500 }
    )
  }
}
