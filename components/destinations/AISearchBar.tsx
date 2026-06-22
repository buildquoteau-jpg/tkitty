'use client'

import { useState, useRef } from 'react'
import LoadingDots from '@/components/ui/LoadingDots'
import type { ItineraryContent } from '@/types'

type Props = {
  groupId: string
  folderId?: string
  groupSize: number
  onResult: (content: ItineraryContent, prompt: string) => void
  placeholder?: string
}

const PROMPT_SUGGESTIONS = [
  'Design a 12 day Portugal trip for 9 women who love food, wine, coastal towns and beautiful hotels.',
  'A slower version of the same trip with less driving.',
  'Compare Portugal and Spain for a 10 day group trip.',
  'Design a week in Japan — food, culture, ryokans, and city life.',
  'A 14 day Italian journey: Rome, Tuscany, Amalfi Coast.',
]

export default function AISearchBar({ groupId, folderId, groupSize, onResult, placeholder }: Props) {
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const query = prompt.trim()
    if (!query || generating) return
    setGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/ai/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query, groupId, groupSize }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to generate itinerary')
      }

      const data = await res.json()
      onResult(data.content, query)
      setPrompt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function applySuggestion(suggestion: string) {
    setPrompt(suggestion)
    textareaRef.current?.focus()
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e)
          }}
          placeholder={
            placeholder ??
            'Design a trip. Try: "12 days in Portugal for 9 women who love food, wine, and beautiful hotels."'
          }
          rows={3}
          className="w-full px-5 py-4 bg-white border border-stone-200 rounded-2xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 resize-none shadow-sm transition-colors leading-relaxed pr-32"
          disabled={generating}
        />
        <div className="absolute right-4 bottom-4">
          <button
            type="submit"
            disabled={!prompt.trim() || generating}
            className="btn-primary text-xs py-2 px-4"
          >
            {generating ? <LoadingDots className="text-white" /> : 'Generate →'}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      {/* Prompt suggestions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {PROMPT_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => applySuggestion(s)}
            disabled={generating}
            className="text-xs text-stone-400 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-lg px-3 py-1.5 transition-colors text-left line-clamp-1 max-w-xs"
          >
            {s}
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs text-stone-300">
        Shift + Enter for new line · ⌘ + Enter to generate
      </p>
    </div>
  )
}
