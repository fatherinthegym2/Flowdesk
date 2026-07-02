import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { createElement } from 'react'
import path from 'path'
import type { DecomposeResult } from '@/types'

// The Google Fonts CDN "KFOmCnqEu92Fr1Mu4mxP" build of Roboto is a Latin-only
// subset with no Cyrillic glyphs. Rendering Cyrillic text with it corrupts
// glyph positioning in @react-pdf/renderer (garbled, overlapping characters).
// These local files are full-coverage builds (Latin + Cyrillic) from the
// upstream googlefonts/roboto source repo.
try {
  Font.register({
    family: 'Roboto',
    fonts: [
      { src: path.join(process.cwd(), 'public/fonts/Roboto-Regular.ttf'), fontWeight: 400 },
      { src: path.join(process.cwd(), 'public/fonts/Roboto-Bold.ttf'), fontWeight: 700 },
    ],
  })
} catch (e) {
  console.warn('Font registration failed:', e)
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Roboto', backgroundColor: '#FAFAF9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 12, borderBottom: '1pt solid #E5E0D8' },
  brand: { fontSize: 16, fontWeight: 700, color: '#C1714A' },
  domain: { fontSize: 10, color: '#9CA3AF' },
  goal: { fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 },
  framework: { fontSize: 11, color: '#C1714A', marginBottom: 20 },
  objective: { marginBottom: 14, padding: 10, backgroundColor: '#F9F6F2', borderRadius: 6 },
  objectiveHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  badge: { fontSize: 9, fontWeight: 700, color: '#FFFFFF', backgroundColor: '#C1714A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
  objectiveTitle: { fontSize: 12, fontWeight: 600, color: '#111827' },
  step: { fontSize: 10, color: '#4B5563', marginLeft: 16, marginBottom: 3 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTop: '1pt solid #E5E0D8', paddingTop: 8 },
  footerText: { fontSize: 9, color: '#9CA3AF' },
})

function buildDocument(goal: string, framework: string, result: DecomposeResult) {
  const today = new Date().toLocaleDateString('ru-RU')

  return createElement(
    Document,
    null,
    createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      createElement(
        View,
        { style: styles.header },
        createElement(Text, { style: styles.brand }, '⚡ FlowDesk'),
        createElement(Text, { style: styles.domain }, 'flowdesk.app')
      ),
      // Goal
      createElement(Text, { style: styles.goal }, goal),
      createElement(Text, { style: styles.framework }, `Фреймворк: ${framework}`),
      // Objectives
      ...result.objectives.map((obj, i) =>
        createElement(
          View,
          { key: String(i), style: styles.objective },
          createElement(
            View,
            { style: styles.objectiveHeader },
            createElement(Text, { style: styles.badge }, String(obj.priority)),
            createElement(Text, { style: styles.objectiveTitle }, obj.title)
          ),
          ...obj.steps.map((step, j) =>
            createElement(Text, { key: String(j), style: styles.step }, `• ${step.title}`)
          )
        )
      ),
      // Footer
      createElement(
        View,
        { style: styles.footer, fixed: true },
        createElement(Text, { style: styles.footerText }, 'Создано в FlowDesk — flowdesk.app'),
        createElement(Text, { style: styles.footerText }, today)
      )
    )
  )
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body || !body.goal || !body.framework || !body.result) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  try {
    const doc = buildDocument(body.goal, body.framework, body.result)
    const buffer = await renderToBuffer(doc)

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="flowdesk-plan.pdf"',
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
