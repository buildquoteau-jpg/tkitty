import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/sign-in', '/sign-up', '/auth/callback']

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          req.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: req.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove: (name, options) => {
          req.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: req.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = req.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p)) || path === '/'

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  if (user && (path === '/sign-in' || path === '/sign-up')) {
    return NextResponse.redirect(new URL('/groups', req.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
