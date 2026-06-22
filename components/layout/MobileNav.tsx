'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/constants'

type Props = {
  groupId: string
}

export default function MobileNav({ groupId }: Props) {
  const pathname = usePathname()
  const base = `/groups/${groupId}`

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 z-40">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const href = `${base}${item.href}`
          const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)
          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                'flex-1 py-3 text-center text-xs transition-colors',
                isActive ? 'text-stone-900 font-medium' : 'text-stone-400'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
