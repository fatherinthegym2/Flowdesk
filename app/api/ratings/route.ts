import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

const MAX_QUERY_LENGTH = 2000
const MAX_RESULT_BYTES = 50_000

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body.rating !== 'number' || typeof body.query !== 'string' || !body.result) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const { query, result, rating } = body

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  let resultJson: string
  try {
    resultJson = JSON.stringify(result)
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  if (resultJson.length > MAX_RESULT_BYTES) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  if (rating <= 3) {
    const supabase = await createServiceClient()
    const { error } = await supabase.from('low_ratings').insert({ query, result, rating })
    if (error) console.warn('Rating insert error:', error)
  }

  return NextResponse.json({ success: true })
}
