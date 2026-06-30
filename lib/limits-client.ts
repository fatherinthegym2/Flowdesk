export function checkGuestLimit(): boolean {
  if (typeof document === 'undefined') return false
  return !document.cookie.includes('fd_guest_used')
}

export function markGuestLimitUsed(): void {
  document.cookie = 'fd_guest_used=1; max-age=31536000; path=/'
}

export function trackGuestVisit(): void {
  if (typeof document === 'undefined') return
  if (!document.cookie.includes('fd_guest_visited')) {
    document.cookie = 'fd_guest_visited=1; max-age=31536000; path=/'
  }
}
