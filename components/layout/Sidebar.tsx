'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/constants'
import type { Group, GroupMember } from '@/types'

type Props = {
  group: Group
  members: GroupMember[]
  allGroups: Group[]
}

export default function Sidebar({ group, members, allGroups }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const base = `/groups/${group.id}`

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-white border-r border-stone-100 py-8 px-6">
      <div className="mb-8">
        <Link href="/groups" className="font-serif text-lg text-stone-900 hover:text-stone-700 transition-colors">
          Travel Kitty
        </Link>
      </div>

      <div className="mb-6">
        <p className="label-text mb-1">Group</p>
        <p className="font-serif text-base text-stone-900 leading-snug">{group.name}</p>
      </div>

      <nav className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const href = `${base}${item.href}`
          const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)
          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                'block px-3 py-2 text-sm rounded-lg transition-colors',
                isActive
                  ? 'bg-stone-100 text-stone-900 font-medium'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-8">
        <p className="label-text mb-3">Members</p>
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-2.5">
              <span className="member-dot" style={{ backgroundColor: member.colour }} />
              <span className="text-sm text-stone-600">{member.first_name}</span>
            </div>
          ))}
        </div>
      </div>

      {allGroups.length > 1 && (
        <div className="mt-6 pt-6 border-t border-stone-100">
          <p className="label-text mb-2">Switch Group</p>
          <div className="space-y-1">
            {allGroups
              .filter((g) => g.id !== group.id)
              .map((g) => (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="block text-xs text-stone-500 hover:text-stone-900 transition-colors py-1 truncate"
                >
                  {g.name}
                </Link>
              ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-6 border-t border-stone-100 flex items-center justify-between">
        <Link href="/groups" className="text-xs text-stone-400 hover:text-stone-700 transition-colors">
          All groups
        </Link>
        <button
          onClick={handleSignOut}
          className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
