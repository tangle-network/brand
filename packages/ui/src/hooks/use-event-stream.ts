"use client";
import { useEffect, useRef } from 'react'

/** Authenticated hosts own reconnects and session lifecycle; native streams use this lifecycle. */
export interface EventStreamSource {
  addEventListener(type: string, listener: (event: MessageEvent<string>) => void): void
  close(): void
}
export type EventStreamOpener = (url: string, onLiveChange?: (live: boolean) => void) => EventStreamSource
export interface EventStreamHandlers {
  events: Readonly<Record<string, (event: MessageEvent<string>) => void>>
  opener?: EventStreamOpener
  after?: () => number
  onStart?: () => void
  onLiveChange?: (live: boolean) => void
}

/** Internal policy preserves the buffered hook's existing bounded exponential retries. */
type NativePolicy = EventStreamHandlers & { terminalEvent?: string; onConnecting?: (attempt: number) => void; retryDelay?: (attempt: number) => number | undefined }

/** The sole native EventSource lifecycle, shared by buffered and producer-owned streams. */
export function openNativeStream(url: string | (() => string), handlers: NativePolicy): { close(): void } {
  let stopped = false, source: EventStreamSource | undefined, retry: ReturnType<typeof setTimeout> | undefined, attempt = 0
  handlers.onStart?.()
  const open = () => {
    handlers.onConnecting?.(attempt)
    const target = new URL(typeof url === 'function' ? url() : url, globalThis.location?.href), after = handlers.after?.()
    if (after !== undefined && after >= 0) target.searchParams.set('after', String(after))
    let connection: EventStreamSource
    const live = (value: boolean) => { if (!stopped && (!connection || source === connection)) handlers.onLiveChange?.(value) }
    connection = handlers.opener ? handlers.opener(target.toString(), live) : new EventSource(target.toString())
    source = connection
    for (const name of new Set([...Object.keys(handlers.events), ...(handlers.terminalEvent ? [handlers.terminalEvent] : [])])) connection.addEventListener(name, event => {
      if (stopped || source !== connection) return
      if (name === handlers.terminalEvent) { stopped = true; clearTimeout(retry); connection.close() }
      handlers.events[name]?.(event)
    })
    if (!handlers.opener) {
      const native = connection as EventSource
      native.onopen = () => { attempt = 0; live(true) }
      native.onerror = () => {
        connection.close()
        if (stopped || source !== connection) return
        live(false)
        const delay = handlers.retryDelay ? handlers.retryDelay(attempt++) : 1_000
        if (delay !== undefined) retry = setTimeout(open, delay)
      }
    }
  }
  open()
  return { close: () => { stopped = true; clearTimeout(retry); source?.close() } }
}

/** Producer-owned named events; host transports keep their authenticated reconnect lifecycle. */
export function useEventStream(url: string | (() => string) | undefined, handlers: EventStreamHandlers): void {
  const latest = useRef(handlers)
  latest.current = handlers
  const names = Object.keys(handlers.events).sort().join(',')
  useEffect(() => {
    if (!url || (!handlers.opener && typeof EventSource === 'undefined')) return
    const current: EventStreamHandlers = {
      opener: handlers.opener,
      events: Object.fromEntries(Object.keys(handlers.events).map(name => [name, (event: MessageEvent<string>) => latest.current.events[name]?.(event)])),
      after: () => latest.current.after?.() ?? -1,
      onStart: () => latest.current.onStart?.(),
      onLiveChange: live => latest.current.onLiveChange?.(live),
    }
    const connection = openNativeStream(url, { ...current, terminalEvent: 'end' })
    return () => connection.close()
  }, [url, handlers.opener, names])
}
