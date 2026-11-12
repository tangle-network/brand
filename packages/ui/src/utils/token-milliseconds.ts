/** Resolve a scoped CSS time, including calc(); absent tokens remain unknown. */
export function tokenMilliseconds(token: string, element?: Element | null) {
  const scope = element ?? (typeof document === 'undefined' ? undefined : document.documentElement), view = scope?.ownerDocument.defaultView
  if (!scope || !view || !view.getComputedStyle(scope).getPropertyValue(token).trim()) return undefined
  const probe = scope.ownerDocument.createElement('i'); probe.hidden = true; scope.append(probe)
  try {
    probe.style.animationDuration = `var(${token})`
    const time = /^(\d+(?:\.\d+)?)(ms|s)$/.exec(view.getComputedStyle(probe).animationDuration)
    return time ? Number(time[1]) * (time[2] === 's' ? 1000 : 1) : undefined
  } finally { probe.remove() }
}
