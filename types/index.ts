export type MemberColour = {
  name: string
  value: string
  light: string
}

export type Group = {
  id: string
  name: string
  created_by: string
  ai_monthly_budget: number
  created_at: string
}

export type GroupMember = {
  id: string
  group_id: string
  user_id: string | null
  first_name: string
  email: string
  colour: string
  role: 'admin' | 'member'
  joined_at: string
}

export type LedgerEntry = {
  id: string
  group_id: string
  date: string
  description: string
  amount: number
  type: 'deposit' | 'withdrawal' | 'interest' | 'expense'
  member_id: string | null
  category: string | null
  notes: string | null
  created_at: string
  group_members?: GroupMember
}

export type StatementImport = {
  id: string
  group_id: string
  filename: string
  imported_by: string
  entries_count: number
  created_at: string
}

export type DestinationFolder = {
  id: string
  group_id: string
  name: string
  destination: string | null
  country: string | null
  cover_image_url: string | null
  cover_image_credit: string | null
  target_date: string | null
  created_by: string
  created_at: string
  itinerary_count?: number
}

export type ItineraryActivity = {
  id: string
  name: string
  description: string
  cost: number
  timeOfDay: 'morning' | 'afternoon' | 'evening'
  type?: string
}

export type ItineraryMeal = {
  type: 'breakfast' | 'lunch' | 'dinner'
  venue: string
  description: string
  cost: number
}

export type ItineraryAccommodation = {
  name: string
  description: string
  pricePerNight: number
  style?: string
}

export type ItineraryDay = {
  day: number
  location: string
  title: string
  description: string
  accommodation?: ItineraryAccommodation
  activities: ItineraryActivity[]
  meals: ItineraryMeal[]
  transport?: {
    description: string
    cost: number
  }
  imageQuery?: string
}

export type ItineraryCostEstimate = {
  accommodation: number
  food: number
  activities: number
  transport: number
  miscellaneous: number
  total: number
  perPerson: number
  groupSize: number
}

export type ItineraryContent = {
  title: string
  subtitle: string
  duration: number
  groupSize: number
  days: ItineraryDay[]
  costEstimate: ItineraryCostEstimate
  highlights: string[]
  bestTimeToVisit?: string
  travelNotes: string
  practicalInfo?: {
    visaRequired?: boolean
    currency?: string
    language?: string
    timezone?: string
    tipping?: string
  }
}

export type Itinerary = {
  id: string
  folder_id: string
  title: string
  version: number
  prompt: string | null
  content: ItineraryContent
  total_cost: number | null
  cost_per_person: number | null
  duration_days: number | null
  created_by: string
  created_at: string
}

export type ItineraryVote = {
  id: string
  itinerary_id: string
  item_id: string
  member_id: string
  vote_type: 'love' | 'not_for_me'
  created_at: string
  group_members?: GroupMember
}

export type FolderImage = {
  id: string
  folder_id: string
  url: string
  caption: string | null
  credit: string | null
  added_by: string
  created_at: string
}

export type MessageThread = {
  id: string
  group_id: string
  folder_id: string | null
  title: string
  category: string | null
  created_by: string
  is_pinned: boolean
  created_at: string
  post_count?: number
  last_post_at?: string
}

export type MessagePost = {
  id: string
  thread_id: string
  content: string
  created_by: string
  created_at: string
}

export type CalendarAvailability = {
  id: string
  group_id: string
  member_id: string
  date: string
  preference: 'preferred' | 'available' | 'unavailable'
}

export type MemberBalance = {
  member: GroupMember
  total_contributed: number
  total_withdrawn: number
  current_balance: number
  history: Array<{ date: string; balance: number }>
}

export type GroupSavings = {
  travel_fund: number
  interest_fund: number
  total: number
  member_balances: MemberBalance[]
}

export type AIUsage = {
  id: string
  group_id: string
  feature: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  created_at: string
}
