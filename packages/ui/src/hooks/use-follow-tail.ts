"use client";
import { type RefObject, useCallback, useLayoutEffect, useRef, useState } from 'react'

/** Keeps the bottom through measured content growth, until the reader deliberately scrolls away. */
export function useFollowTail(scroller: RefObject<HTMLElement | null>, { identity, content, follow = true, target, thresholdPx = 40, requireScrollInput = false }: {
  identity?: unknown; content?: unknown; follow?: boolean; target?: unknown; thresholdPx?: number; requireScrollInput?: boolean
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
    const pin = () => { if (following.current) node.scrollTop = node.scrollHeight }
    let touchY = 0
    const wheel = (event: WheelEvent) => { if (event.deltaY < 0) following.current = false }
    const key = (event: KeyboardEvent) => {
      if (['Home', 'PageUp', 'ArrowUp'].includes(event.key) || (event.shiftKey && [' ', 'Tab'].includes(event.key))) following.current = false
    }
    const start = (event: TouchEvent) => { touchY = event.touches[0].clientY }
    const move = (event: TouchEvent) => {
      const y = event.touches[0].clientY
      if (y > touchY) following.current = false
      touchY = y
    }
    const drag = (event: PointerEvent) => {
      // Native scrollbar dragging or track paging is a reader-directed scroll.
      if (event.target === node && event.offsetX >= node.clientWidth - 12) following.current = false
    }
    const track = () => {
      const near = node.scrollHeight - node.scrollTop - node.clientHeight < latest.current.thresholdPx
      if (near || !requireScrollInput) following.current = latest.current.follow && near
      else pin() // WebKit may shift a growing row after our previous layout pin.
      setAtBottom(near || following.current)
      if (near) setUnseen(false)
    }
    node.addEventListener('scroll', track, { passive: true })
    const input = requireScrollInput ? new AbortController() : undefined
    if (input) {
      const options = { passive: true, signal: input.signal }
      node.addEventListener('wheel', wheel, options)
      node.addEventListener('keydown', key, options)
      node.addEventListener('touchstart', start, options)
      node.addEventListener('touchmove', move, options)
      node.addEventListener('pointerdown', drag, options)
    }
    if (!following.current) setUnseen(true)
    pin()
    const observer = new ResizeObserver(pin)
    observer.observe(node)
    for (const child of node.children) observer.observe(child)
    return () => { input?.abort(); observer.disconnect(); node.removeEventListener('scroll', track) }
  }, [content, follow, identity, requireScrollInput])
  return { following, unseen, jump, atBottom }
}
