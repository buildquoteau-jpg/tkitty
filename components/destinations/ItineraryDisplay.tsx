'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { getDestinationPhoto } from '@/lib/constants'
import VotingSystem from './VotingSystem'
import CostSummary from './CostSummary'
import type { Itinerary, GroupMember, ItineraryVote } from '@/types'

type Props = {
  itinerary: Itinerary
  versions: Itinerary[]
  onVersionSelect: (id: string) => void
  votes: ItineraryVote[]
  members: GroupMember[]
  currentMemberId: string | null
  groupId: string
  currentSavings: number
  onSaveToFolder: () => void
  isSaved: boolean
  folderId?: string
}

const TIME_OF_DAY_LABEL: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
}

export default function ItineraryDisplay({
  itinerary,
  versions,
  onVersionSelect,
  votes,
  members,
  currentMemberId,
  groupId,
  currentSavings,
  onSaveToFolder,
  isSaved,
  folderId,
}: Props) {
  const [activeDay, setActiveDay] = useState(1)
  const content = itinerary.content

  const activeData = content.days.find((d) => d.day === activeDay) ?? content.days[0]

  const dayPhoto = activeData
    ? getDestinationPhoto(activeData.imageQuery ?? activeData.location)
    : null

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-stone-900">{content.title}</h2>
            <p className="mt-1 text-sm text-stone-500 italic">{content.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isSaved && (
              <button onClick={onSaveToFolder} className="btn-secondary text-xs py-2 px-3">
                Save to folder
              </button>
            )}
          </div>
        </div>

        {/* Highlights */}
        {content.highlights.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {content.highlights.map((h) => (
              <span key={h} className="text-xs text-stone-600 bg-stone-100 rounded-full px-3 py-1">
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Versions */}
        {versions.length > 1 && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-stone-400">Versions:</span>
            <div className="flex gap-1.5">
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onVersionSelect(v.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                    v.id === itinerary.id
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  V{v.version}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Day selector + main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Day navigation */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {content.days.map((day) => (
              <button
                key={day.day}
                onClick={() => setActiveDay(day.day)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  activeDay === day.day
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                }`}
              >
                Day {day.day}
              </button>
            ))}
          </div>

          {/* Day content */}
          {activeData && (
            <div className="card overflow-hidden">
              {/* Photo */}
              {dayPhoto && (
                <div className="relative h-52 bg-stone-100">
                  <img
                    src={dayPhoto.url}
                    alt={activeData.location}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="photo-overlay" />
                  <div className="absolute bottom-4 left-5 text-white">
                    <p className="text-xs text-white/70 mb-0.5">Day {activeData.day}</p>
                    <p className="font-serif text-xl">{activeData.location}</p>
                  </div>
                  {dayPhoto.credit && (
                    <p className="absolute bottom-2 right-3 text-white/40 text-[10px]">
                      Photo: {dayPhoto.credit} / Unsplash
                    </p>
                  )}
                </div>
              )}

              <div className="p-5 space-y-5">
                {/* Day title & description */}
                <div>
                  <h3 className="font-serif text-lg text-stone-900">{activeData.title}</h3>
                  <p className="mt-1.5 text-sm text-stone-500 leading-relaxed">{activeData.description}</p>
                </div>

                {/* Accommodation */}
                {activeData.accommodation && (
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="label-text mb-2">Accommodation</p>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-stone-800">{activeData.accommodation.name}</p>
                        {activeData.accommodation.style && (
                          <p className="text-xs text-stone-400 mt-0.5">{activeData.accommodation.style}</p>
                        )}
                        <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                          {activeData.accommodation.description}
                        </p>
                      </div>
                      <p className="text-sm text-stone-600 flex-shrink-0">
                        {formatCurrency(activeData.accommodation.pricePerNight)}/night
                      </p>
                    </div>
                    <VotingSystem
                      itemId={`day${activeData.day}_accommodation`}
                      itineraryId={itinerary.id}
                      folderId={folderId ?? itinerary.folder_id}
                      groupId={groupId}
                      currentMemberId={currentMemberId}
                      votes={votes}
                      members={members}
                    />
                  </div>
                )}

                {/* Activities */}
                {activeData.activities.length > 0 && (
                  <div>
                    <p className="label-text mb-3">Activities</p>
                    <div className="space-y-3">
                      {activeData.activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="border border-stone-100 rounded-xl p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-stone-800">{activity.name}</p>
                                <span className="text-[10px] text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded">
                                  {TIME_OF_DAY_LABEL[activity.timeOfDay] ?? activity.timeOfDay}
                                </span>
                              </div>
                              <p className="text-xs text-stone-500 leading-relaxed">{activity.description}</p>
                            </div>
                            {activity.cost > 0 && (
                              <p className="text-sm text-stone-600 flex-shrink-0">
                                {formatCurrency(activity.cost)}/person
                              </p>
                            )}
                          </div>
                          <VotingSystem
                            itemId={activity.id}
                            itineraryId={itinerary.id}
                            folderId={folderId ?? itinerary.folder_id}
                            groupId={groupId}
                            currentMemberId={currentMemberId}
                            votes={votes}
                            members={members}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meals */}
                {activeData.meals.length > 0 && (
                  <div>
                    <p className="label-text mb-3">Dining</p>
                    <div className="space-y-2.5">
                      {activeData.meals.map((meal, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-xs text-stone-400 capitalize w-16 flex-shrink-0 pt-0.5">
                            {meal.type}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-stone-800">{meal.venue}</p>
                            <p className="text-xs text-stone-500 mt-0.5">{meal.description}</p>
                          </div>
                          {meal.cost > 0 && (
                            <p className="text-xs text-stone-400 flex-shrink-0">
                              {formatCurrency(meal.cost)}/person
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transport */}
                {activeData.transport && (
                  <div className="flex items-start justify-between gap-3 pt-3 border-t border-stone-50">
                    <div>
                      <p className="label-text mb-1">Transport</p>
                      <p className="text-sm text-stone-500">{activeData.transport.description}</p>
                    </div>
                    {activeData.transport.cost > 0 && (
                      <p className="text-sm text-stone-600">{formatCurrency(activeData.transport.cost)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Travel notes */}
          {content.travelNotes && (
            <div className="card-padded">
              <p className="label-text mb-3">Travel Notes</p>
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                {content.travelNotes}
              </p>
            </div>
          )}

          {/* Practical info */}
          {content.practicalInfo && (
            <div className="card-padded">
              <p className="label-text mb-3">Practical Info</p>
              <div className="grid grid-cols-2 gap-3">
                {content.practicalInfo.currency && (
                  <div>
                    <p className="text-xs text-stone-400">Currency</p>
                    <p className="text-sm text-stone-700 mt-0.5">{content.practicalInfo.currency}</p>
                  </div>
                )}
                {content.practicalInfo.language && (
                  <div>
                    <p className="text-xs text-stone-400">Language</p>
                    <p className="text-sm text-stone-700 mt-0.5">{content.practicalInfo.language}</p>
                  </div>
                )}
                {content.practicalInfo.timezone && (
                  <div>
                    <p className="text-xs text-stone-400">Timezone</p>
                    <p className="text-sm text-stone-700 mt-0.5">{content.practicalInfo.timezone}</p>
                  </div>
                )}
                {content.practicalInfo.tipping && (
                  <div>
                    <p className="text-xs text-stone-400">Tipping</p>
                    <p className="text-sm text-stone-700 mt-0.5">{content.practicalInfo.tipping}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: cost summary */}
        <div className="space-y-4">
          <CostSummary
            costEstimate={content.costEstimate}
            currentSavings={currentSavings}
          />

          {/* Trip overview */}
          <div className="card-padded">
            <p className="label-text mb-3">Trip Overview</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400">Duration</span>
                <span className="text-sm text-stone-700">{content.duration} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400">Group size</span>
                <span className="text-sm text-stone-700">{content.groupSize} people</span>
              </div>
              {content.bestTimeToVisit && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400">Best time</span>
                  <span className="text-sm text-stone-700">{content.bestTimeToVisit}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
