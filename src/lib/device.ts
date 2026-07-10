export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false

  const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window
  const narrow = window.matchMedia('(max-width: 1024px)').matches
  const standalone = window.matchMedia('(display-mode: standalone)').matches

  return hasTouch && (narrow || standalone)
}
