import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { GroupMember, LedgerEntry, MemberBalance } from '@/types'

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

  const [{ data: entries }, { data: members }] = await Promise.all([
    supabase
      .from('ledger_entries')
      .select('*, group_members(first_name, colour)')
      .eq('group_id', params.groupId)
      .order('date', { ascending: false }),
    supabase.from('group_members').select('*').eq('group_id', params.groupId),
  ])

  const allEntries = (entries ?? []) as (LedgerEntry & { group_members?: { first_name: string; colour: string } })[]
  const allMembers = (members ?? []) as GroupMember[]

  // Calculate fund totals
  let travelFund = 0
  let interestFund = 0

  for (const entry of allEntries) {
    if (entry.type === 'deposit') travelFund += entry.amount
    else if (entry.type === 'withdrawal' || entry.type === 'expense') travelFund -= entry.amount
    else if (entry.type === 'interest') interestFund += entry.amount
  }

  // Calculate member balances with history
  const memberBalances: MemberBalance[] = allMembers.map((member) => {
    const memberEntries = allEntries
      .filter((e) => e.member_id === member.id)
      .sort((a, b) => a.date.localeCompare(b.date))

    let runningBalance = 0
    const history: Array<{ date: string; balance: number }> = []
    let totalContributed = 0
    let totalWithdrawn = 0

    for (const entry of memberEntries) {
      if (entry.type === 'deposit') {
        totalContributed += entry.amount
        runningBalance += entry.amount
      } else if (entry.type === 'withdrawal' || entry.type === 'expense') {
        totalWithdrawn += entry.amount
        runningBalance -= entry.amount
      }
      history.push({ date: entry.date, balance: runningBalance })
    }

    return {
      member,
      total_contributed: totalContributed,
      total_withdrawn: totalWithdrawn,
      current_balance: runningBalance,
      history,
    }
  })

  return NextResponse.json({
    travelFund: Math.max(0, travelFund),
    interestFund: Math.max(0, interestFund),
    recentEntries: allEntries.slice(0, 20),
    memberBalances,
  })
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

  const { entries, filename } = await req.json()

  if (!entries?.length) {
    return NextResponse.json({ error: 'No entries provided' }, { status: 400 })
  }

  // Create import record
  const { data: importRecord } = await supabase
    .from('statement_imports')
    .insert({
      group_id: params.groupId,
      filename: filename ?? 'statement',
      imported_by: userId,
      entries_count: entries.length,
    })
    .select()
    .single()

  // Insert ledger entries
  const rows = entries.map((e: { date: string; description: string; amount: number; type: string; category?: string; notes?: string; member_id?: string }) => ({
    group_id: params.groupId,
    date: e.date,
    description: e.description,
    amount: Math.abs(e.amount),
    type: e.type,
    member_id: e.member_id ?? null,
    category: e.category ?? null,
    notes: e.notes ?? null,
    import_id: importRecord?.id ?? null,
  }))

  const { error } = await supabase.from('ledger_entries').insert(rows)

  if (error) {
    return NextResponse.json({ error: 'Failed to save entries' }, { status: 500 })
  }

  return NextResponse.json({ imported: rows.length })
}
