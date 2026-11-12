/** Read a CSS time token at its consuming element, with an SSR-safe fallback. */
export function tokenMilliseconds(token: string, element?: Element | null) {
  if (typeof document === 'undefined') return 0
  const value = getComputedStyle(element ?? document.documentElement).getPropertyValue(token).trim()
  return (parseFloat(value) || 0) * (value.endsWith('ms') ? 1 : 1000)
}
