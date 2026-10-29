import { useCallback, useMemo, type RefObject } from 'react'
import { useFollowTail } from './use-follow-tail'

/** Existing chat contract, backed by the shared measured-content following lifecycle. */
export function useAutoScroll(containerRef: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  const content = useMemo(() => ({}), deps)
  const { atBottom, jump } = useFollowTail(containerRef, { content })
  const scrollToBottom = useCallback(() => jump('smooth'), [jump])
  return { isAtBottom: atBottom, scrollToBottom }
}
