import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { MEMBER_COLOURS } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'AUD'): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  })
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatShortDate(dateString)
}

export function getMemberColour(colourValue: string): typeof MEMBER_COLOURS[0] {
  return MEMBER_COLOURS.find(c => c.value === colourValue) ?? MEMBER_COLOURS[0]
}

export function assignMemberColour(index: number): string {
  return MEMBER_COLOURS[index % MEMBER_COLOURS.length].value
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const group = String(item[key])
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

export function sumBy<T>(arr: T[], key: keyof T): number {
  return arr.reduce((sum, item) => sum + (Number(item[key]) || 0), 0)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function parseCSVDate(dateStr: string): string {
  // Handle common date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD MMM YYYY
  const formats = [
    { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, order: 'dmy' },
    { regex: /^(\d{4})-(\d{2})-(\d{2})$/, order: 'ymd' },
    { regex: /^(\d{2})-(\d{2})-(\d{4})$/, order: 'dmy' },
  ]
  for (const fmt of formats) {
    const m = dateStr.match(fmt.regex)
    if (m) {
      if (fmt.order === 'dmy') return `${m[3]}-${m[2]}-${m[1]}`
      if (fmt.order === 'ymd') return `${m[1]}-${m[2]}-${m[3]}`
    }
  }
  // Try native Date parsing as fallback
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return dateStr
}
