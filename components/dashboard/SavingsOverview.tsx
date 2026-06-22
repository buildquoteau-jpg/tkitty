'use client'

import { formatCurrency } from '@/lib/utils'
import type { LedgerEntry } from '@/types'
import { formatDate } from '@/lib/utils'

type Props = {
  travelFund: number
  interestFund: number
  recentEntries: LedgerEntry[]
  groupId: string
  onUploadStatement: () => void
}

export default function SavingsOverview({
  travelFund,
  interestFund,
  recentEntries,
  groupId,
  onUploadStatement,
}: Props) {
  const total = travelFund + interestFund

  return (
    <div className="space-y-6">
      {/* Fund totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-padded">
          <p className="label-text mb-3">Shared Travel Fund</p>
          <p className="amount-large">{formatCurrency(travelFund)}</p>
        </div>
        <div className="card-padded">
          <p className="label-text mb-3">Shared Interest Fund</p>
          <p className="amount-large text-stone-600">{formatCurrency(interestFund)}</p>
        </div>
        <div className="card-padded bg-stone-900">
          <p className="label-text mb-3 text-stone-400">Total Group Funds</p>
          <p className="amount-large text-white">{formatCurrency(total)}</p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card-padded">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Recent Activity</h2>
          <button
            onClick={onUploadStatement}
            className="btn-secondary text-xs py-2 px-3"
          >
            Import Statement
          </button>
        </div>

        {recentEntries.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-stone-400">No transactions yet.</p>
            <p className="mt-1 text-xs text-stone-300">
              Import a bank statement to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {recentEntries.map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-3.5 border-b border-stone-50 last:border-0"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                    style={{
                      backgroundColor:
                        entry.type === 'deposit' || entry.type === 'interest'
                          ? '#7D9B76'
                          : '#D4856A',
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-stone-800 truncate">{entry.description}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {formatDate(entry.date)}
                      {entry.group_members && (
                        <span className="ml-2">· {entry.group_members.first_name}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p
                    className={`text-sm font-medium ${
                      entry.type === 'deposit' || entry.type === 'interest'
                        ? 'text-stone-800'
                        : 'text-stone-500'
                    }`}
                  >
                    {entry.type === 'withdrawal' || entry.type === 'expense' ? '−' : '+'}
                    {formatCurrency(entry.amount)}
                  </p>
                  <p className="text-xs text-stone-300 capitalize mt-0.5">{entry.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
