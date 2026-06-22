'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import type { GroupMember, LedgerEntry } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

type ParsedEntry = {
  date: string
  description: string
  amount: number
  type: string
  category?: string
  notes?: string
  suggestedMemberId?: string
}

type Props = {
  groupId: string
  members: GroupMember[]
  onSuccess: () => void
  onClose: () => void
}

export default function StatementUpload({ groupId, members, onSuccess, onClose }: Props) {
  const [step, setStep] = useState<'upload' | 'review' | 'saving'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [entries, setEntries] = useState<ParsedEntry[]>([])
  const [memberAssignments, setMemberAssignments] = useState<Record<number, string>>({})
  const [error, setError] = useState('')

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setError('')
    setParsing(true)

    try {
      const formData = new FormData()
      formData.append('file', f)
      formData.append('groupId', groupId)

      const res = await fetch(`/api/groups/${groupId}/parse-statement`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Failed to parse statement')

      const data = await res.json()
      setEntries(data.entries)

      // Auto-assign members where suggested
      const assignments: Record<number, string> = {}
      data.entries.forEach((entry: ParsedEntry, i: number) => {
        if (entry.suggestedMemberId) {
          assignments[i] = entry.suggestedMemberId
        }
      })
      setMemberAssignments(assignments)
      setStep('review')
    } catch (err) {
      setError('Could not parse this file. Please check it\'s a valid bank statement CSV or PDF.')
    } finally {
      setParsing(false)
    }
  }, [groupId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  async function handleSave() {
    setStep('saving')
    try {
      const payload = entries.map((entry, i) => ({
        ...entry,
        member_id: memberAssignments[i] ?? null,
      }))

      const res = await fetch(`/api/groups/${groupId}/ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: payload,
          filename: file?.name,
        }),
      })

      if (!res.ok) throw new Error('Failed to save entries')
      onSuccess()
    } catch {
      setError('Failed to save entries. Please try again.')
      setStep('review')
    }
  }

  if (step === 'upload') {
    return (
      <div className="p-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-stone-400 bg-stone-50' : 'border-stone-200 hover:border-stone-300'}
          `}
        >
          <input {...getInputProps()} />
          {parsing ? (
            <div className="text-stone-500">
              <p className="text-sm">Analysing statement with Claude…</p>
              <p className="text-xs text-stone-400 mt-1">This may take a moment.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-stone-600">
                {isDragActive ? 'Drop your statement here' : 'Drag a bank statement here'}
              </p>
              <p className="text-xs text-stone-400 mt-1">CSV or PDF · up to 10MB</p>
              <button
                type="button"
                className="mt-4 btn-secondary text-xs py-1.5 px-3"
              >
                Browse files
              </button>
            </>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <p className="mt-4 text-xs text-stone-400 leading-relaxed">
          Claude will read your statement and identify deposits, withdrawals, interest payments,
          and expenses. Nothing is stored beyond what you approve.
        </p>
      </div>
    )
  }

  if (step === 'review') {
    const deposits = entries.filter((e) => e.type === 'deposit' || e.type === 'interest')
    const withdrawals = entries.filter((e) => e.type === 'withdrawal' || e.type === 'expense')
    const totalIn = deposits.reduce((s, e) => s + e.amount, 0)
    const totalOut = withdrawals.reduce((s, e) => s + e.amount, 0)

    return (
      <div className="p-6">
        <div className="flex items-center gap-6 mb-5 pb-4 border-b border-stone-100">
          <div>
            <p className="text-xs text-stone-400">Transactions found</p>
            <p className="text-xl font-serif text-stone-900 mt-0.5">{entries.length}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400">Total in</p>
            <p className="text-xl font-serif text-stone-900 mt-0.5">{formatCurrency(totalIn)}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400">Total out</p>
            <p className="text-xl font-serif text-stone-900 mt-0.5">{formatCurrency(totalOut)}</p>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-0 -mx-1 px-1">
          {entries.map((entry, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2.5 border-b border-stone-50 gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-800 truncate">{entry.description}</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {formatDate(entry.date)} · <span className="capitalize">{entry.type}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={memberAssignments[i] ?? ''}
                  onChange={(e) =>
                    setMemberAssignments((prev) => ({ ...prev, [i]: e.target.value }))
                  }
                  className="text-xs border border-stone-200 rounded-lg px-2 py-1 text-stone-600 bg-white"
                >
                  <option value="">No member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name}
                    </option>
                  ))}
                </select>
                <span
                  className={`text-sm font-medium ${
                    entry.type === 'deposit' || entry.type === 'interest'
                      ? 'text-stone-800'
                      : 'text-stone-400'
                  }`}
                >
                  {entry.type === 'withdrawal' || entry.type === 'expense' ? '−' : '+'}
                  {formatCurrency(entry.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => { setStep('upload'); setEntries([]) }}
            className="btn-secondary flex-1"
          >
            Try another file
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex-1"
          >
            Save {entries.length} entries
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-10 text-center">
      <p className="text-sm text-stone-500">Saving entries…</p>
    </div>
  )
}
