import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase-server'
import { cleanEnv } from '@/lib/env'

export async function GET(req: NextRequest) {
  const resend = new Resend(cleanEnv(process.env.RESEND_API_KEY))
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${cleanEnv(process.env.CRON_SECRET)}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const cutoff = sevenDaysAgo.toISOString().split('T')[0]

  // Only consider accounts old enough that "haven't emailed them yet" doesn't
  // mean "signed up minutes ago" — same 7-day window used for re-sends below.
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email')
    .lte('created_at', cutoff)
    .or(`last_retention_email_sent.is.null,last_retention_email_sent.lte.${cutoff}`)

  if (error) {
    console.error('Cron: failed to fetch users:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const today = new Date().toISOString().split('T')[0]
  let sent = 0

  for (const user of users ?? []) {
    if (!user.email) continue
    try {
      await resend.emails.send({
        from: 'FlowDesk <noreply@flowdesk.app>',
        to: user.email,
        subject: 'Ваши задачи ждут — вернитесь к планированию 🎯',
        html: `
          <p>Привет!</p>
          <p>Вы уже использовали FlowDesk для планирования. Как продвигаются ваши цели?</p>
          <p>Вернитесь и разберите следующую задачу — у вас ещё есть бесплатные запросы сегодня.</p>
          <p><a href="https://flowdesk.app" style="color:#C1714A">Открыть FlowDesk →</a></p>
          <hr>
          <p style="font-size:12px;color:#999">Вы получаете это письмо как зарегистрированный пользователь FlowDesk. <a href="https://flowdesk.app/unsubscribe">Отписаться</a></p>
        `,
      })

      await supabase
        .from('profiles')
        .update({ last_retention_email_sent: today })
        .eq('id', user.id)

      sent++
    } catch (err) {
      console.error(`Cron: failed to send email to ${user.email}:`, err)
    }
  }

  return NextResponse.json({ sent, total: users?.length ?? 0 })
}
