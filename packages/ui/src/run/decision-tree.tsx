import { type KeyboardEvent, type ReactNode, type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, GitFork, Loader2, X } from "lucide-react";
import { cn } from "../lib/utils";

export interface DecisionOption {
  id: string;
  /** The action, in a few words. */
  label: ReactNode;
  /** What happens if it is chosen: who sees it, what it costs. */
  detail?: ReactNode;
  icon?: ReactNode;
  /** The agent recommends this branch. */
  recommended?: boolean;
  /** The consequence costs something the person should weigh; it is highlighted. */
  caution?: boolean;
  /** A question the branch needs answered before the agent can act. */
  followUp?: { question: ReactNode; options: readonly DecisionOption[] };
}

export interface Decision {
  id: string;
  agent: { name: ReactNode; model?: ReactNode; icon?: ReactNode };
  risk?: "high" | "medium" | "low";
  /** What happened and what the agent asks, in one or two sentences. */
  question: ReactNode;
  /** The numbers behind the question. */
  context?: ReactNode;
  options: readonly DecisionOption[];
  /** A choice already made (after a reload, or by someone else); the card shows the chosen path. */
  chosen?: DecisionChoice;
  /** Set by the host once the agent acts on a choice: running, then its report. */
  outcome?: { state: "running" | "done" | "failed"; label?: ReactNode; message?: ReactNode };
}

export type DecisionChoice = { path: readonly string[] } | { instead: string };

const fromChoice = (choice?: DecisionChoice) => choice === undefined ? undefined : "instead" in choice ? choice.instead : choice.path;

export interface DecisionTreeProps {
  decisions: readonly Decision[];
  /** Called once per decision; the card shows "Approved · running" until the host sets `outcome`. */
  onDecide: (decisionId: string, choice: DecisionChoice) => void;
  title?: ReactNode;
  /** Offer a free-text branch: "Tell the agent what to do instead". Default true. */
  allowInstead?: boolean;
  className?: string;
}

const RISK = {
  high: { label: "High risk", className: "bg-[var(--surface-danger-bg,hsl(var(--destructive)/0.12))] text-[var(--surface-danger-text,hsl(var(--destructive)))]" },
  medium: { label: "Medium risk", className: "bg-[var(--surface-warning-bg,hsl(38_92%_50%/0.14))] text-[var(--surface-warning-text,hsl(32_80%_38%))]" },
  low: { label: "Low risk", className: "bg-muted text-muted-foreground" },
} as const;

const card = "rounded-xl border border-border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.06)]";

/** Orthogonal connectors from a source's right edge to each target's left edge, measured after layout. */
function useConnectors(root: RefObject<HTMLElement | null>, deps: unknown[]) {
  const [paths, setPaths] = useState<{ d: string; dim: boolean }[]>([]);
  const measure = useCallback(() => {
    const host = root.current;
    if (!host) return;
    const box = host.getBoundingClientRect();
    const next: { d: string; dim: boolean }[] = [];
    for (const target of host.querySelectorAll<HTMLElement>("[data-from]")) {
      const source = host.querySelector<HTMLElement>(`[data-node="${target.dataset.from}"]`);
      if (!source) continue;
      const a = source.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      const x1 = a.right - box.left, y1 = a.top + a.height / 2 - box.top;
      const x2 = b.left - box.left, y2 = b.top + b.height / 2 - box.top;
      const xm = x1 + Math.max(8, (x2 - x1) / 2), r = Math.min(6, Math.abs(y2 - y1) / 2, (x2 - x1) / 2);
      const dir = y2 > y1 ? 1 : -1;
      next.push({
        d: Math.abs(y2 - y1) < 1 ? `M${x1},${y1}H${x2}` : `M${x1},${y1}H${xm - r}Q${xm},${y1} ${xm},${y1 + dir * r}V${y2 - dir * r}Q${xm},${y2} ${xm + r},${y2}H${x2}`,
        dim: target.dataset.dim === "true",
      });
    }
    setPaths(next);
  }, [root]);
  useLayoutEffect(measure, [measure, ...deps]);
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, [measure, root]);
  return paths;
}

function KeyChip({ n }: { n: number }) {
  return <kbd className="inline-grid size-5 shrink-0 place-items-center rounded-md border border-border bg-muted font-sans text-[11px] text-muted-foreground">{n}</kbd>;
}

function OptionCard({ option, index, from, node, dim, active, onFocus, onChoose }: {
  option: DecisionOption; index: number; from: string; node: string; dim: boolean; active: boolean;
  onFocus: () => void; onChoose: () => void;
}) {
  return (
    <button type="button" data-from={from} data-node={node} data-dim={dim} onMouseEnter={onFocus} onFocus={onFocus} onClick={onChoose}
      aria-keyshortcuts={String(index + 1)}
      className={cn(card, "flex w-full flex-col gap-1 px-3 py-2 text-left text-sm transition-[opacity,box-shadow,border-color] duration-150 motion-reduce:transition-none",
        "hover:border-[var(--accent-text,hsl(var(--primary)))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-text,hsl(var(--primary)))]",
        active && "border-[color-mix(in_oklab,var(--accent-text,hsl(var(--primary)))_45%,transparent)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent-text,hsl(var(--primary)))_12%,transparent)]",
        dim && "opacity-40")}>
      <span className="flex items-center gap-2">
        <KeyChip n={index + 1} />
        {option.icon && <span aria-hidden className="inline-flex size-4 shrink-0 items-center justify-center [&>*]:size-4">{option.icon}</span>}
        <span className="min-w-0 font-medium text-foreground">{option.label}</span>
        {option.recommended && <span className="ml-auto shrink-0 text-xs font-medium text-[var(--accent-text,hsl(var(--primary)))]">Agent&rsquo;s pick</span>}
      </span>
      {option.detail && <span className={cn("pl-7 text-xs leading-5 text-muted-foreground", option.caution && "w-fit rounded bg-[var(--surface-warning-bg,hsl(38_92%_50%/0.16))] px-1 text-[var(--surface-warning-text,hsl(32_80%_34%))]")}>{option.detail}</span>}
    </button>
  );
}

function QuestionCard({ decision }: { decision: Decision }) {
  const risk = decision.risk ? RISK[decision.risk] : undefined;
  return (
    <div className="flex w-64 shrink-0 flex-col gap-2">
      {risk && <span className={cn("w-fit rounded-md px-1.5 py-0.5 text-xs font-medium", risk.className)}>{risk.label}</span>}
      <div data-node="question" className={cn(card, "space-y-3 p-4")}>
        <div className="flex items-center gap-2.5">
          {decision.agent.icon && <span aria-hidden className="inline-grid size-8 shrink-0 place-items-center rounded-lg border border-border [&>*]:size-4">{decision.agent.icon}</span>}
          <div className="min-w-0 leading-5">
            <div className="truncate text-sm font-medium text-foreground">{decision.agent.name}</div>
            {decision.agent.model && <div className="truncate text-xs text-muted-foreground">{decision.agent.model}</div>}
          </div>
        </div>
        <p className="text-[15px] font-semibold leading-6 text-foreground">{decision.question}</p>
        {decision.context && <p className="text-xs leading-5 text-muted-foreground">{decision.context}</p>}
      </div>
    </div>
  );
}

function Outcome({ from, decision, local }: { from: string; decision: Decision; local: boolean }) {
  const outcome = decision.outcome ?? (local ? { state: "running" as const } : undefined);
  if (!outcome) return null;
  const icon = outcome.state === "failed"
    ? <X className="size-4 text-[var(--surface-danger-text,hsl(var(--destructive)))]" />
    : <Check className="size-4 text-[var(--surface-success-text,hsl(var(--primary)))]" />;
  return (
    <div data-from={from} role="status" className={cn(card, "w-72 space-y-1 px-3 py-2 text-sm motion-safe:animate-in motion-safe:fade-in")}>
      <div className="flex items-center gap-2 font-medium text-foreground">
        {icon}
        {outcome.label ?? (outcome.state === "running" ? "Approved" : outcome.state === "failed" ? "Did not run" : "Done")}
        {outcome.state === "running" && <span className="flex items-center gap-1 font-normal text-muted-foreground">· running<Loader2 aria-hidden className="size-3 motion-safe:animate-spin" /></span>}
      </div>
      {outcome.message && <p className="text-xs leading-5 text-muted-foreground">{outcome.message}</p>}
    </div>
  );
}

/**
 * The human-in-the-loop card: an agent's question with its numbers and risk, the branches it offers with their
 * consequences and its pick, follow-up questions a branch needs, and a free-text "do this instead". Keys 1–N pick a
 * branch, Escape steps back, ←/→ page between waiting decisions. After a choice the card collapses to the chosen
 * path and shows "Approved · running" until the host reports the agent's outcome.
 */
export function DecisionTree({ decisions, onDecide, title = "Decisions", allowInstead = true, className }: DecisionTreeProps) {
  const root = useRef<HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [focus, setFocus] = useState<number>(-1);
  const [chosen, setChosen] = useState<Record<string, readonly string[] | string>>({});
  const [instead, setInstead] = useState("");
  const decision = decisions[Math.min(page, decisions.length - 1)];
  const choice = decision ? chosen[decision.id] ?? fromChoice(decision.chosen) : undefined;
  const top = decision && focus >= 0 ? decision.options[focus] : undefined;
  const pending = decisions.filter(item => !chosen[item.id] && !item.chosen && !item.outcome).length;
  const paths = useConnectors(root, [decision?.id, focus, choice, instead.length > 0]);

  useEffect(() => { setFocus(decision?.options.findIndex(option => option.recommended) ?? -1); setInstead(""); }, [decision?.id]);

  const decide = (value: readonly string[] | string) => {
    if (!decision) return;
    setChosen(previous => ({ ...previous, [decision.id]: value }));
    onDecide(decision.id, typeof value === "string" ? { instead: value } : { path: value });
  };
  const choose = (option: DecisionOption, parent?: DecisionOption) => {
    if (!parent && option.followUp) { setFocus(decision!.options.indexOf(option)); return; }
    decide(parent ? [parent.id, option.id] : [option.id]);
  };

  const keydown = (event: KeyboardEvent<HTMLElement>) => {
    if (!decision || event.target instanceof HTMLTextAreaElement || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      setPage(p => Math.max(0, Math.min(decisions.length - 1, p + (event.key === "ArrowRight" ? 1 : -1))));
      return;
    }
    if (choice) return;
    if (event.key === "Escape") { setFocus(-1); return; }
    const n = Number(event.key);
    if (!Number.isInteger(n) || n < 1) return;
    const level = top?.followUp?.options;
    if (level && n <= level.length) { event.preventDefault(); choose(level[n - 1]!, top); return; }
    if (n <= decision.options.length) { event.preventDefault(); choose(decision.options[n - 1]!); }
    else if (allowInstead && n === decision.options.length + 1) { event.preventDefault(); root.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus(); }
  };

  if (!decision) return null;
  const path = typeof choice === "string" ? undefined : choice;
  const picked = path ? decision.options.find(option => option.id === path[0]) : undefined;
  const pickedFollow = path && picked?.followUp ? picked.followUp.options.find(option => option.id === path[1]) : undefined;

  return (
    <section ref={root} tabIndex={0} onKeyDown={keydown} aria-label={typeof title === "string" ? title : "Decisions"}
      className={cn("relative space-y-6 outline-none", className)}>
      <header className="flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <GitFork aria-hidden className="size-4 text-[var(--accent-text,hsl(var(--primary)))]" />
          <span className="font-semibold text-foreground">{title}</span>
          <span className="text-muted-foreground">{pending === 0 ? "none waiting" : `${pending} waiting for you`}</span>
        </div>
        {decisions.length > 1 && (
          <div className="flex items-center gap-2 text-muted-foreground" aria-label={`Decision ${page + 1} of ${decisions.length}`}>
            <span className="flex gap-1" aria-hidden>{decisions.map((item, i) => <span key={item.id} className={cn("size-1.5 rounded-full", i === page ? "bg-foreground" : "bg-border")} />)}</span>
            <span className="tabular-nums">{page + 1} of {decisions.length}</span>
          </div>
        )}
      </header>
      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
        {paths.map((p, i) => <path key={i} d={p.d} fill="none" strokeWidth={1.25} className={cn("stroke-border transition-opacity duration-150", p.dim && "opacity-40")} />)}
      </svg>
      <div className="flex items-center gap-10">
        <QuestionCard decision={decision} />
        {choice !== undefined ? (
          <div className="flex items-center gap-10">
            <div data-from="question" data-node="picked" className={cn(card, "w-56 px-3 py-2 text-sm font-medium text-foreground")}>
              {typeof choice === "string" ? <span className="block whitespace-pre-wrap font-normal">{choice}</span> : picked?.label}
            </div>
            {pickedFollow && <div data-from="picked" data-node="picked-follow" className={cn(card, "w-64 space-y-1 px-3 py-2 text-sm")}>
              <div className="font-medium text-foreground">{pickedFollow.label}</div>
              {pickedFollow.detail && <div className="text-xs text-muted-foreground">{pickedFollow.detail}</div>}
            </div>}
            <Outcome from={pickedFollow ? "picked-follow" : "picked"} decision={decision} local={chosen[decision.id] !== undefined} />
          </div>
        ) : (
          <>
            <div className="flex w-60 shrink-0 flex-col gap-3" role="group" aria-label="Branches">
              {decision.options.map((option, i) => (
                <OptionCard key={option.id} option={option} index={i} from="question" node={`option-${i}`} dim={focus >= 0 && focus !== i} active={focus === i}
                  onFocus={() => setFocus(i)} onChoose={() => choose(option)} />
              ))}
              {allowInstead && (
                <label data-from="question" data-dim={focus >= 0 && instead.length === 0} className={cn(card, "block px-3 py-2 transition-opacity", focus >= 0 && !instead && "opacity-60")}>
                  <span className="sr-only">Tell the agent what to do instead</span>
                  <textarea rows={2} value={instead} onChange={event => setInstead(event.target.value)} placeholder="Tell the agent what to do instead…"
                    onFocus={() => setFocus(-1)}
                    onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && instead.trim()) { event.preventDefault(); decide(instead.trim()); } }}
                    className="w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
                </label>
              )}
            </div>
            {top?.followUp && (
              <div key={top.id} className="flex w-72 shrink-0 flex-col gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-1" role="group" aria-label="Follow-up">
                <div data-from={`option-${focus}`} data-node="follow-question" className={cn(card, "w-fit px-3 py-1.5 text-sm font-medium text-foreground")}>{top.followUp.question}</div>
                {top.followUp.options.map((option, i) => (
                  <OptionCard key={option.id} option={option} index={i} from="follow-question" node={`follow-${i}`} dim={false} active={false}
                    onFocus={() => {}} onChoose={() => choose(option, top)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {choice === undefined && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {top?.followUp ? "Answer" : "Pick a branch"} <KeyChip n={1} /> – <KeyChip n={(top?.followUp?.options.length ?? decision.options.length) + (top?.followUp || !allowInstead ? 0 : 1)} />
          {top?.followUp && <span className="ml-2">Esc to go back</span>}
        </p>
      )}
    </section>
  );
}
