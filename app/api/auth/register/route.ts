import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cleanEnv } from '@/lib/env'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}))

  if (!email || !password) {
    return NextResponse.json({ error: 'Email и пароль обязательны' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Пароль должен быть не менее 6 символов' }, { status: 400 })
  }

  const adminClient = createClient(
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Create user with email_confirm: true to bypass SMTP requirement
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    if (error.message?.toLowerCase().includes('already registered') ||
        error.message?.toLowerCase().includes('already been registered') ||
        error.message?.toLowerCase().includes('already exists')) {
      return NextResponse.json({ error: 'Этот email уже зарегистрирован' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Ошибка при регистрации' }, { status: 400 })
  }

  return NextResponse.json({ user: data.user }, { status: 201 })
}
