import type { MemberColour } from '@/types'

export const MEMBER_COLOURS: MemberColour[] = [
  { name: 'Sage', value: '#7D9B76', light: '#EBF2EA' },
  { name: 'Dusty Blue', value: '#6B8CAE', light: '#E5EDF5' },
  { name: 'Soft Coral', value: '#D4856A', light: '#FAF0EC' },
  { name: 'Warm Sand', value: '#C4A882', light: '#F7F2EC' },
  { name: 'Lavender', value: '#9B8BB4', light: '#F2EFF7' },
  { name: 'Terracotta', value: '#C17B5C', light: '#F9EDEA' },
  { name: 'Blush', value: '#D4897A', light: '#FAECEA' },
  { name: 'Slate', value: '#708090', light: '#EFF1F3' },
]

export const THREAD_CATEGORIES = [
  'Accommodation',
  'Food & Restaurants',
  'Flights',
  'Activities',
  'Transport',
  'Budget',
  'General',
]

export const LEDGER_TYPES = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  interest: 'Interest',
  expense: 'Expense',
} as const

export const AVAILABILITY_PREFERENCES = {
  preferred: { label: 'Preferred', colour: '#7D9B76' },
  available: { label: 'Available', colour: '#C4A882' },
  unavailable: { label: 'Unavailable', colour: '#D4856A' },
} as const

// Curated Unsplash photo IDs for popular destinations
export const DESTINATION_PHOTOS: Record<string, { id: string; credit: string }> = {
  portugal: { id: '1548707309-dcebeab9ea9b', credit: 'Eduardo Casajús Gorostiaga' },
  lisbon: { id: '1555881400-74d7acaacd8b', credit: 'Spencer Davis' },
  porto: { id: '1558618666-fcd25c85cd64', credit: 'Félix Prado' },
  algarve: { id: '1555881400-74d7acaacd8b', credit: 'Spencer Davis' },
  douro: { id: '1533681904393-3d35bb09e3e0', credit: 'Dan Novac' },
  japan: { id: '1492571350019-22de08371fd3', credit: 'Louie Martinez' },
  tokyo: { id: '1540959733332-eab4deabeeaf', credit: 'Florian Wehde' },
  kyoto: { id: '1528360983277-13d401cdc186', credit: 'Nikita Karimov' },
  italy: { id: '1534308983496-4fabb1a015ee', credit: 'Matteo Catanese' },
  rome: { id: '1555993539-1732b0258235', credit: 'Pedro Lastra' },
  amalfi: { id: '1516483638261-f4dbaf036963', credit: 'Daniele Colucci' },
  tuscany: { id: '1558618047-3c8c76ca7d13', credit: 'Kira auf der Heide' },
  france: { id: '1499856871958-5b9627545d1a', credit: 'Chris Karidis' },
  paris: { id: '1502602235173-39d6a6b17ae2', credit: 'Mathias Reding' },
  spain: { id: '1543783207-ec64e4d95325', credit: 'Florian Wehde' },
  barcelona: { id: '1539037116277-4db20889f2d4', credit: 'Ilnur Kalimullin' },
  greece: { id: '1564594736014-d09ca885b85f', credit: 'Ishan Seefromthesky' },
  santorini: { id: '1537996194471-e657df975ab4', credit: 'Osman Rana' },
  bali: { id: '1537832816519-689ad163238b', credit: 'Enrico Mantegazza' },
  maldives: { id: '1505228901891-7a78c9e0003f', credit: 'Ibrahim Asad' },
  iceland: { id: '1520769945061-0a5a3e26bef2', credit: 'Adam Chang' },
  new_zealand: { id: '1507699622108-4be3abd695ad', credit: 'Tobias Keller' },
  default: { id: '1488646953279-85791f67db48', credit: 'Annie Spratt' },
}

export const getDestinationPhoto = (destination: string): { url: string; credit: string } => {
  const key = destination.toLowerCase().replace(/\s+/g, '_')
  const exactMatch = DESTINATION_PHOTOS[key]
  if (exactMatch) {
    return {
      url: `https://images.unsplash.com/photo-${exactMatch.id}?w=1200&auto=format&fit=crop&q=80`,
      credit: exactMatch.credit,
    }
  }
  // Try partial match
  for (const [k, v] of Object.entries(DESTINATION_PHOTOS)) {
    if (key.includes(k) || k.includes(key)) {
      return {
        url: `https://images.unsplash.com/photo-${v.id}?w=1200&auto=format&fit=crop&q=80`,
        credit: v.credit,
      }
    }
  }
  const fallback = DESTINATION_PHOTOS.default
  return {
    url: `https://images.unsplash.com/photo-${fallback.id}?w=1200&auto=format&fit=crop&q=80`,
    credit: fallback.credit,
  }
}

export const ANTHROPIC_MODEL = 'claude-sonnet-4-6'

export const NAV_ITEMS = [
  { label: 'Savings', href: '' },
  { label: 'Destinations', href: '/destinations' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Messages', href: '/messages' },
  { label: 'Settings', href: '/settings' },
]
