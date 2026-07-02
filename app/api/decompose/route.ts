import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-server'
import { checkAndDecrementUserLimit } from '@/lib/limits-server'
import { callClaude } from '@/lib/claude'
import { hashQuery } from '@/lib/cache'
import { isValidDecomposeResponse } from '@/lib/validate-result'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body.query !== 'string') {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const { query, siteLocale = 'ru' } = body

  if (query.length > 2000) {
    return NextResponse.json(
      { error: 'Запрос слишком длинный. Сократите описание до 2000 символов' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let remaining: number | undefined

  if (user) {
    const limitResult = await checkAndDecrementUserLimit(user.id, user.email ?? undefined)
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Вы использовали все запросы на сегодня' },
        { status: 429 }
      )
    }
    remaining = limitResult.remaining
  }

  // Проверка кэша (без учёта регистра и пробелов, включая внутренние)
  const queryHash = hashQuery(query)
  const serviceClient = await createServiceClient()
  const { data: cached } = await serviceClient.from('cache').select('result').eq('query_hash', queryHash).single()

  if (cached?.result) {
    return NextResponse.json({ ...cached.result, remaining })
  }

  // Вызов Claude
  let rawText: string
  try {
    rawText = await callClaude(query, siteLocale)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Claude API error:', msg)
    return NextResponse.json({ error: 'Claude API error', detail: msg }, { status: 502 })
  }

  let parsed: unknown
  try {
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('Invalid JSON from Claude:', rawText)
    return NextResponse.json({ error: 'Invalid response from AI' }, { status: 502 })
  }

  if (!isValidDecomposeResponse(parsed)) {
    console.error('Malformed decompose response from Claude:', rawText)
    return NextResponse.json({ error: 'Invalid response from AI' }, { status: 502 })
  }

  // Сохранение в кэш — await'ится, чтобы serverless-рантайм не убил запись
  // до её завершения (ответ уже успешно провалидирован выше).
  const { error: cacheError } = await serviceClient.from('cache').insert({ query_hash: queryHash, result: parsed })
  if (cacheError) console.warn('Cache insert error:', cacheError)

  return NextResponse.json({ ...parsed, remaining })
}
