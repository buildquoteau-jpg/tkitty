'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { MemberBalance } from '@/types'

type Props = {
  balances: MemberBalance[]
}

type ChartDataPoint = {
  date: string
  [memberName: string]: number | string
}

function buildChartData(balances: MemberBalance[]): ChartDataPoint[] {
  // Collect all unique dates across all members
  const dateSet = new Set<string>()
  for (const mb of balances) {
    for (const point of mb.history) {
      dateSet.add(point.date)
    }
  }
  const dates = Array.from(dateSet).sort()

  return dates.map((date) => {
    const point: ChartDataPoint = { date }
    for (const mb of balances) {
      // Find the most recent balance at or before this date
      const history = mb.history.filter((h) => h.date <= date)
      const last = history[history.length - 1]
      point[mb.member.first_name] = last?.balance ?? 0
    }
    return point
  })
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-stone-100 rounded-xl shadow-sm p-3 text-sm">
      <p className="text-xs text-stone-400 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-stone-600">{p.name}</span>
          <span className="ml-auto font-medium text-stone-900">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function MemberBalances({ balances }: Props) {
  const chartData = buildChartData(balances)
  const hasData = chartData.length > 0

  return (
    <div className="card-padded">
      <h2 className="section-title mb-6">Member Balances</h2>

      {/* Chart */}
      {hasData && balances.some((b) => b.history.length > 1) ? (
        <div className="mb-8 -mx-2">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#a8a29e' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) =>
                  new Date(val).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
                }
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#a8a29e' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              {balances.map((mb) => (
                <Line
                  key={mb.member.id}
                  type="monotone"
                  dataKey={mb.member.first_name}
                  stroke={mb.member.colour}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {/* Balance table */}
      <div className="space-y-0">
        {balances.map((mb) => (
          <div
            key={mb.member.id}
            className="flex items-center justify-between py-3.5 border-b border-stone-50 last:border-0"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: mb.member.colour }}
              />
              <span className="text-sm text-stone-800">{mb.member.first_name}</span>
            </div>
            <div className="flex items-center gap-8 text-right">
              <div className="hidden sm:block">
                <p className="text-xs text-stone-400">Contributed</p>
                <p className="text-sm text-stone-600 mt-0.5">{formatCurrency(mb.total_contributed)}</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-stone-400">Withdrawn</p>
                <p className="text-sm text-stone-600 mt-0.5">{formatCurrency(mb.total_withdrawn)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400">Balance</p>
                <p className="text-sm font-medium text-stone-900 mt-0.5">
                  {formatCurrency(mb.current_balance)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {balances.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-8">
            No member balances yet. Import a bank statement to get started.
          </p>
        )}
      </div>
    </div>
  )
}
