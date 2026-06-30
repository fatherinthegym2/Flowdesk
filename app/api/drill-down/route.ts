import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { checkAndDecrementUserLimit } from '@/lib/limits-server'
import { callClaudeDrillDown } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body || !body.objective || !body.previousResult) {
    return NextResponse.json(
      { error: 'Недостаточно данных для детализации' },
      { status: 400 }
    )
  }

  const { objective, previousResult, framework, goal } = body

  const limitResult = await checkAndDecrementUserLimit(user.id, user.email ?? undefined)
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Вы использовали все запросы на сегодня' },
      { status: 429 }
    )
  }

  let rawText: string
  try {
    rawText = await callClaudeDrillDown(
      objective,
      previousResult,
      framework ?? 'MoSCoW',
      goal ?? objective
    )
  } catch (err) {
    console.error('Claude API error (drill-down):', err)
    return NextResponse.json({ error: 'Claude API error' }, { status: 502 })
  }

  let parsed: object
  try {
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('Invalid JSON from Claude (drill-down):', rawText)
    return NextResponse.json({ error: 'Invalid response from AI' }, { status: 502 })
  }

  return NextResponse.json({ ...parsed, remaining: limitResult.remaining })
}
