import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '../primitives/button';
import { createCopyFeedback, writeClipboard, type CopyFeedback } from '../code-presentation';

/** Shared clipboard behavior for section commands and file actions. */
export function CommandCopy({ text, label = 'Copy command', children }: { text: string; label?: string; children?: string }) {
  const button = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<CopyFeedback>({ copied: false, pending: false, status: '' });
  const feedback = useRef<ReturnType<typeof createCopyFeedback> | null>(null);
  useEffect(() => {
    feedback.current = createCopyFeedback(setState, writeClipboard, button.current ?? undefined);
    return () => feedback.current?.dispose();
  }, []);
  return <><Button ref={button} variant={children ? 'outline' : 'bare'} className={children ? 'mk-btn mk-ghost' : 'mk-copy'} data-marketing-copy={text} aria-label={state.copied ? 'Copied' : label} aria-busy={state.pending} onClick={() => feedback.current?.copy(text)}>{children ?? (state.copied ? <Check size={15} /> : <Copy size={15} />)}</Button><span className="mk-sr" role="status">{state.status}</span></>;
}

export function InstallRow({ command }: { command: string }) {
  return <div className="mk mk-install"><code><span className="mk-prompt">$ </span>{command}</code><CommandCopy text={command} /></div>;
}
