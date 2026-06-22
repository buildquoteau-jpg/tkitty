import Anthropic from '@anthropic-ai/sdk'
import { ANTHROPIC_MODEL } from './constants'
import type { ItineraryContent } from '@/types'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const ITINERARY_SYSTEM_PROMPT = `You are an expert travel planner specialising in bespoke group travel experiences. You create detailed, beautiful, and practical itineraries for small groups of friends.

When given a travel request, respond with a valid JSON object matching this exact structure:
{
  "title": "Trip title (evocative, magazine-style)",
  "subtitle": "A single elegant sentence describing the trip",
  "duration": <number of days>,
  "groupSize": <number>,
  "highlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4", "highlight 5"],
  "bestTimeToVisit": "e.g. April to June",
  "travelNotes": "2-3 paragraphs of practical travel wisdom for this specific trip",
  "practicalInfo": {
    "currency": "e.g. Euro (EUR)",
    "language": "e.g. Portuguese",
    "timezone": "e.g. WET (UTC+0)",
    "tipping": "Brief tipping guidance"
  },
  "days": [
    {
      "day": 1,
      "location": "City or region name",
      "title": "Day title",
      "description": "2-3 sentences describing the day's essence",
      "accommodation": {
        "name": "Hotel/accommodation name",
        "description": "1-2 sentences",
        "pricePerNight": <number per room per night in AUD>,
        "style": "e.g. Boutique hotel, villa, resort"
      },
      "activities": [
        {
          "id": "day1_activity1",
          "name": "Activity name",
          "description": "2-3 sentences",
          "cost": <per person cost in AUD>,
          "timeOfDay": "morning" | "afternoon" | "evening",
          "type": "e.g. cultural, culinary, nature, leisure"
        }
      ],
      "meals": [
        {
          "type": "breakfast" | "lunch" | "dinner",
          "venue": "Restaurant or venue name",
          "description": "1-2 sentences",
          "cost": <per person in AUD>
        }
      ],
      "transport": {
        "description": "How you move today",
        "cost": <total for group in AUD>
      },
      "imageQuery": "2-3 word Unsplash search query for this location"
    }
  ],
  "costEstimate": {
    "accommodation": <total AUD for all nights for group>,
    "food": <total AUD for all meals for group>,
    "activities": <total AUD for all activities for group>,
    "transport": <total AUD for all transport for group>,
    "miscellaneous": <total AUD for misc>,
    "total": <grand total AUD>,
    "perPerson": <total divided by group size>,
    "groupSize": <group size>
  }
}

IMPORTANT:
- All costs in Australian Dollars (AUD)
- Be specific with real venue names, hotels, restaurants
- Recommend genuinely excellent places — think Condé Nast Traveller quality
- Keep tone warm, knowledgeable, not corporate
- Only return valid JSON, no other text`

export async function generateItinerary(
  prompt: string,
  groupSize: number = 9
): Promise<{ content: ItineraryContent; inputTokens: number; outputTokens: number }> {
  const message = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 8000,
    system: ITINERARY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `${prompt}\n\nGroup size: ${groupSize} people`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  // Extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')

  const content = JSON.parse(jsonMatch[0]) as ItineraryContent

  return {
    content,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  }
}

export const STATEMENT_PARSE_PROMPT = `You are a financial reconciliation assistant. You will be given the raw text content of a bank statement (CSV or extracted from PDF).

Analyse the transactions and return a JSON array of ledger entries:

[
  {
    "date": "YYYY-MM-DD",
    "description": "Clean transaction description",
    "amount": <positive number>,
    "type": "deposit" | "withdrawal" | "interest" | "expense",
    "category": "optional category e.g. transfer, fee, interest, accommodation, activities",
    "notes": "optional additional context"
  }
]

Rules:
- "deposit" = money coming IN to the account
- "withdrawal" = money going OUT
- "interest" = interest credited
- "expense" = a travel-related purchase
- Keep amounts as positive numbers (type conveys direction)
- Clean up messy bank descriptions into readable text
- Skip header rows, balance rows, opening/closing balance lines
- Only return the JSON array, no other text`

export async function parseStatement(
  rawText: string,
  memberNames: string[]
): Promise<{ entries: Array<{ date: string; description: string; amount: number; type: string; category?: string; notes?: string; suggestedMember?: string }>; inputTokens: number; outputTokens: number }> {
  const message = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `${STATEMENT_PARSE_PROMPT}\n\nGroup members: ${memberNames.join(', ')}\n\nBank statement content:\n${rawText}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON array found in response')

  const entries = JSON.parse(jsonMatch[0])

  return {
    entries,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  }
}

export async function analyseAvailability(
  availabilityData: string,
  members: string[],
  targetDuration: number
): Promise<string> {
  const message = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `Analyse this group availability data and find the best travel window.

Members: ${members.join(', ')}
Target trip duration: ${targetDuration} days

Availability data (format: date, member, preference):
${availabilityData}

Find the ${targetDuration}-day window where the most members are available, prioritising windows where all or most members have "preferred" availability.

Respond with:
1. Best window: [Start Date] — [End Date]
2. Members available: list
3. Members unavailable: list (if any)
4. Second best option (if relevant)
5. Brief recommendation

Keep it concise and clear.`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

// Token cost calculation (Claude claude-sonnet-4-6 pricing)
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 3.0  // $3 per 1M input tokens
  const outputCost = (outputTokens / 1_000_000) * 15.0 // $15 per 1M output tokens
  return inputCost + outputCost
}
