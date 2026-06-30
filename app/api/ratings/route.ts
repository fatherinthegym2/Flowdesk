import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body.rating !== 'number' || !body.query || !body.result) {
    return NextResponse.json({ success: true })
  }

  const { query, result, rating } = body

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ success: true })
  }

  if (rating <= 3) {
    const supabase = await createServiceClient()
    const { error } = await supabase.from('low_ratings').insert({ query, result, rating })
    if (error) console.warn('Rating insert error:', error)
  }

  return NextResponse.json({ success: true })
}
