"use client";
import { type RefObject, useCallback, useLayoutEffect, useRef, useState } from 'react'

/** Keeps the bottom through measured content growth, until the reader deliberately scrolls away. */
export function useFollowTail(scroller: RefObject<HTMLElement | null>, { identity, content, follow = true, target, thresholdPx = 40 }: {
  identity?: unknown; content?: unknown; follow?: boolean; target?: unknown; thresholdPx?: number
}) {
  const following = useRef(false), latest = useRef({ follow, target, thresholdPx })
  latest.current = { follow, target, thresholdPx }
  const [unseen, setUnseen] = useState(false), [atBottom, setAtBottom] = useState(true)
  const jump = useCallback((behavior: ScrollBehavior = 'auto') => { const node = scroller.current; following.current = latest.current.follow; setUnseen(false); setAtBottom(true); if (node) node.scrollTo({ top: node.scrollHeight, behavior }) }, [scroller])
  useLayoutEffect(() => {
    following.current = latest.current.follow && !latest.current.target
    setUnseen(false)
    if (scroller.current && !latest.current.target) scroller.current.scrollTop = following.current ? scroller.current.scrollHeight : 0
  }, [identity])
  useLayoutEffect(() => { if (!follow) following.current = false }, [follow])
  useLayoutEffect(() => {
    const node = scroller.current
    if (!node) return
    const track = () => { const near = node.scrollHeight - node.scrollTop - node.clientHeight < latest.current.thresholdPx; following.current = latest.current.follow && near; setAtBottom(near); if (near) setUnseen(false) }
    node.addEventListener('scroll', track, { passive: true })
    const pin = () => { if (following.current) node.scrollTop = node.scrollHeight }
    if (!following.current) setUnseen(true)
    pin()
    const observer = new ResizeObserver(pin)
    observer.observe(node)
    for (const child of node.children) observer.observe(child)
    return () => { observer.disconnect(); node.removeEventListener('scroll', track) }
  }, [content, follow, identity])
  return { following, unseen, jump, atBottom }
}
