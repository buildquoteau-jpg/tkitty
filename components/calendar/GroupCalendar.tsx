'use client'

import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns'
import { cn, hexToRgba } from '@/lib/utils'
import LoadingDots from '@/components/ui/LoadingDots'
import type { GroupMember, CalendarAvailability } from '@/types'

type Preference = 'preferred' | 'available' | 'unavailable'

type Props = {
  groupId: string
  members: GroupMember[]
  availability: CalendarAvailability[]
  currentMemberId: string | null
  onAvailabilityChange: (date: string, preference: Preference | null) => Promise<void>
  onFindBestWindow: (duration: number) => Promise<void>
  findingWindow: boolean
  windowResult: string | null
}

const PREFERENCE_COLOURS: Record<Preference, { bg: string; label: string }> = {
  preferred: { bg: '#7D9B76', label: 'Preferred' },
  available: { bg: '#C4A882', label: 'Available' },
  unavailable: { bg: '#D4856A', label: 'Unavailable' },
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function GroupCalendar({
  groupId,
  members,
  availability,
  currentMemberId,
  onAvailabilityChange,
  onFindBestWindow,
  findingWindow,
  windowResult,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [duration, setDuration] = useState(12)

  const availabilityMap = useMemo(() => {
    const map: Record<string, CalendarAvailability[]> = {}
    for (const a of availability) {
      if (!map[a.date]) map[a.date] = []
      map[a.date].push(a)
    }
    return map
  }, [availability])

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const leadingDays = getDay(startOfMonth(currentMonth))

  function getMyPreference(dateStr: string): Preference | null {
    if (!currentMemberId) return null
    const entries = availabilityMap[dateStr] ?? []
    return (entries.find((a) => a.member_id === currentMemberId)?.preference as Preference) ?? null
  }

  function getMemberCount(dateStr: string, pref: Preference): number {
    return (availabilityMap[dateStr] ?? []).filter((a) => a.preference === pref).length
  }

  function getMembersForDate(dateStr: string): CalendarAvailability[] {
    return availabilityMap[dateStr] ?? []
  }

  async function handleDateClick(dateStr: string) {
    setSelectedDate(selectedDate === dateStr ? null : dateStr)
  }

  async function setPreference(dateStr: string, pref: Preference | null) {
    const myPref = getMyPreference(dateStr)
    await onAvailabilityChange(dateStr, pref === myPref ? null : pref)
  }

  return (
    <div className="space-y-6">
      {/* Find best window */}
      <div className="card-padded">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-serif text-lg text-stone-900">Find Best Travel Window</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Claude will analyse everyone&apos;s availability and find the ideal window.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-500">Duration</label>
              <input
                type="number"
                min={3}
                max={30}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-16 text-sm border border-stone-200 rounded-lg px-2 py-1 text-center"
              />
              <span className="text-xs text-stone-500">days</span>
            </div>
            <button
              onClick={() => onFindBestWindow(duration)}
              disabled={findingWindow}
              className="btn-primary text-xs py-2 px-4"
            >
              {findingWindow ? <LoadingDots className="text-white" /> : 'Find Window'}
            </button>
          </div>
        </div>

        {windowResult && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">
              {windowResult}
            </p>
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="card-padded">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="btn-ghost py-1 px-2"
          >
            ←
          </button>
          <h3 className="font-serif text-lg text-stone-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="btn-ghost py-1 px-2"
          >
            →
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          {Object.entries(PREFERENCE_COLOURS).map(([pref, { bg, label }]) => (
            <div key={pref} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bg }} />
              <span className="text-xs text-stone-500">{label}</span>
            </div>
          ))}
          {currentMemberId && (
            <span className="text-xs text-stone-400 ml-auto">Click a date to set your availability</span>
          )}
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs text-stone-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Leading empty cells */}
          {Array.from({ length: leadingDays }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const myPref = getMyPreference(dateStr)
            const dayAvail = getMembersForDate(dateStr)
            const isSelected = selectedDate === dateStr
            const todayDay = isToday(day)

            return (
              <div key={dateStr} className="relative">
                <button
                  onClick={() => handleDateClick(dateStr)}
                  className={cn(
                    'w-full aspect-square rounded-lg flex flex-col items-center justify-start pt-1 transition-all text-xs relative overflow-hidden',
                    isSelected ? 'ring-2 ring-stone-900 ring-offset-1' : '',
                    todayDay ? 'font-bold' : '',
                    myPref
                      ? 'opacity-100'
                      : 'hover:bg-stone-50'
                  )}
                  style={
                    myPref
                      ? {
                          backgroundColor: hexToRgba(PREFERENCE_COLOURS[myPref].bg, 0.15),
                        }
                      : undefined
                  }
                >
                  <span className={cn(
                    'text-xs',
                    todayDay ? 'text-stone-900 font-semibold' : 'text-stone-600'
                  )}>
                    {format(day, 'd')}
                  </span>

                  {/* Member colour bars */}
                  {dayAvail.length > 0 && (
                    <div className="flex gap-px mt-1 flex-wrap justify-center px-0.5">
                      {dayAvail.slice(0, 6).map((a) => {
                        const member = members.find((m) => m.id === a.member_id)
                        if (!member) return null
                        return (
                          <span
                            key={a.id}
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            title={`${member.first_name}: ${a.preference}`}
                            style={{
                              backgroundColor: member.colour,
                              opacity: a.preference === 'unavailable' ? 0.3 : a.preference === 'preferred' ? 1 : 0.6,
                            }}
                          />
                        )
                      })}
                    </div>
                  )}
                </button>

                {/* Selected date popover */}
                {isSelected && currentMemberId && (
                  <div className="absolute top-full left-0 z-20 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg p-2 min-w-max">
                    <p className="text-xs text-stone-400 px-1 mb-2">{format(day, 'd MMM yyyy')}</p>
                    {Object.entries(PREFERENCE_COLOURS).map(([pref, { bg, label }]) => (
                      <button
                        key={pref}
                        onClick={() => setPreference(dateStr, pref as Preference)}
                        className={cn(
                          'flex items-center gap-2 w-full text-xs px-2 py-1.5 rounded-lg hover:bg-stone-50 transition-colors',
                          myPref === pref ? 'font-medium' : 'text-stone-600'
                        )}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: bg }}
                        />
                        {label}
                        {myPref === pref && <span className="ml-auto text-stone-400">✓</span>}
                      </button>
                    ))}
                    <button
                      onClick={() => setPreference(dateStr, null)}
                      className="flex items-center gap-2 w-full text-xs px-2 py-1.5 rounded-lg hover:bg-stone-50 text-stone-400"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
