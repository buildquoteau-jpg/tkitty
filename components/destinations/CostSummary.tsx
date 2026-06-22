import { formatCurrency } from '@/lib/utils'
import type { ItineraryCostEstimate } from '@/types'

type Props = {
  costEstimate: ItineraryCostEstimate
  currentSavings: number
}

export default function CostSummary({ costEstimate, currentSavings }: Props) {
  const shortfall = Math.max(0, costEstimate.total - currentSavings)
  const perPersonRequired = costEstimate.groupSize > 0 ? shortfall / costEstimate.groupSize : 0
  const fundingPercentage = Math.min(100, Math.round((currentSavings / costEstimate.total) * 100))

  return (
    <div className="card-padded space-y-6">
      <h3 className="section-title">Cost Estimate</h3>

      {/* Breakdown */}
      <div className="space-y-3">
        {[
          { label: 'Accommodation', value: costEstimate.accommodation },
          { label: 'Food & Dining', value: costEstimate.food },
          { label: 'Activities', value: costEstimate.activities },
          { label: 'Transport', value: costEstimate.transport },
          { label: 'Miscellaneous', value: costEstimate.miscellaneous },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-sm text-stone-500">{label}</span>
            <span className="text-sm text-stone-700">{formatCurrency(value)}</span>
          </div>
        ))}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <span className="text-sm font-medium text-stone-800">Total Trip Cost</span>
          <span className="font-serif text-xl text-stone-900">{formatCurrency(costEstimate.total)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-stone-500">Per person ({costEstimate.groupSize})</span>
          <span className="text-sm font-medium text-stone-700">{formatCurrency(costEstimate.perPerson)}</span>
        </div>
      </div>

      {/* Funding status */}
      <div className="pt-4 border-t border-stone-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-stone-400">Funding progress</span>
          <span className="text-xs font-medium text-stone-600">{fundingPercentage}%</span>
        </div>
        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-stone-800 rounded-full transition-all"
            style={{ width: `${fundingPercentage}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-stone-400">Current Savings</p>
            <p className="font-serif text-base text-stone-900 mt-1">{formatCurrency(currentSavings)}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400">Shortfall</p>
            <p className={`font-serif text-base mt-1 ${shortfall > 0 ? 'text-stone-700' : 'text-stone-400'}`}>
              {shortfall > 0 ? formatCurrency(shortfall) : 'Covered'}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-400">Per person needed</p>
            <p className="font-serif text-base text-stone-900 mt-1">
              {shortfall > 0 ? formatCurrency(perPersonRequired) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
