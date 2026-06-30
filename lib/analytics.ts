declare const gtag: (...args: unknown[]) => void

export function trackEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  if (typeof gtag === 'undefined') return
  gtag('event', event, params)
}

export const analytics = {
  inputSent: () => trackEvent('input_sent'),
  exampleClicked: () => trackEvent('example_clicked'),
  resultViewed: () => trackEvent('result_viewed'),
  ratingSubmitted: (rating: number) => trackEvent('rating_submitted', { rating }),
  userRegistered: () => trackEvent('user_registered'),
  nextStepClicked: () => trackEvent('next_step_clicked'),
  formatSelected: (format: string) => trackEvent('format_selected', { format }),
  resultDownloaded: () => trackEvent('result_downloaded'),
  upgradeClicked: () => trackEvent('upgrade_clicked'),
  guestSessionStarted: () => trackEvent('guest_session_started'),
}
