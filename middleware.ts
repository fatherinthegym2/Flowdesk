import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cleanEnv } from '@/lib/env'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const protectedApiRoutes = ['/api/drill-down', '/api/pdf']
  if (protectedApiRoutes.some((route) => pathname.startsWith(route))) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (pathname.startsWith('/api/cron/retention')) {
    const authHeader = request.headers.get('authorization')
    const expected = `Bearer ${process.env.CRON_SECRET}`
    if (authHeader !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
