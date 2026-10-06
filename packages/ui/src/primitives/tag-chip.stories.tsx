import type { Meta, StoryObj } from "@storybook/react";
import { FileText, Image as ImageIcon, Mic, Video } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "./button";
import { Chip } from "./chip";
import { EmptyState } from "./empty-state";
import { IconTile } from "./icon-tile";
import { Skeleton } from "./skeleton";
import { StatusPill, type StatusTone } from "./status-pill";
import { Tag } from "./tag";
import type { CategoryTone } from "./tone";

/**
 * Example data for a content board: the shape GTM's publishing board has. All
 * of it is local to the story; no backend is involved.
 */
type Kind = "article" | "image" | "video" | "audio";
type Post = { id: string; title: string; kind: Kind; campaign: string; status: StatusTone; statusLabel: string };

const KINDS: Record<Kind, { label: string; tone: CategoryTone; icon: ReactNode }> = {
  article: { label: "Article", tone: "blue", icon: <FileText /> },
  image: { label: "Image", tone: "pink", icon: <ImageIcon /> },
  video: { label: "Video", tone: "orange", icon: <Video /> },
  audio: { label: "Audio", tone: "teal", icon: <Mic /> },
};

const POSTS: Post[] = [
  { id: "1", title: "Launch notes for the October release", kind: "article", campaign: "Launch", status: "success", statusLabel: "Published" },
  { id: "2", title: "Sandbox cold start, before and after", kind: "video", campaign: "Performance", status: "warning", statusLabel: "Scheduled" },
  { id: "3", title: "Founder interview: why agents need a runtime that can be inspected end to end by the people who pay for it", kind: "audio", campaign: "Brand", status: "running", statusLabel: "Sending" },
  { id: "4", title: "Pricing page hero", kind: "image", campaign: "Launch", status: "danger", statusLabel: "Failed" },
  { id: "5", title: "Draft: weekly changelog", kind: "article", campaign: "Changelog", status: "neutral", statusLabel: "Draft" },
];

/** Renders the same content on a dark and a light island, side by side. */
function BothThemes({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-2">
      {(["dark", "light"] as const).map((theme) => (
        <div
          key={theme}
          data-theme={theme}
          className="min-w-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-root)] p-4 text-[var(--text-primary)]"
        >
          {children}
        </div>
      ))}
    </div>
  );
}

function ContentBoard({ initialState = "populated" }: { initialState?: "populated" | "loading" }) {
  const [kinds, setKinds] = useState<Set<Kind>>(new Set());
  const [campaigns, setCampaigns] = useState<string[]>(["Launch"]);
  const [loading, setLoading] = useState(initialState === "loading");
  const visible = POSTS.filter(
    (p) => (kinds.size === 0 || kinds.has(p.kind)) && (campaigns.length === 0 || campaigns.includes(p.campaign)),
  );
  const toggleKind = (kind: Kind, on: boolean) =>
    setKinds((prev) => {
      const next = new Set(prev);
      if (on) next.add(kind);
      else next.delete(kind);
      return next;
    });

  return (
    <section className="flex min-w-0 flex-col gap-3" aria-label="Content board">
      <div role="group" aria-label="Filter by kind" className="flex flex-wrap gap-1.5">
        {(Object.keys(KINDS) as Kind[]).map((kind) => (
          <Chip
            key={kind}
            tone={KINDS[kind].tone}
            icon={KINDS[kind].icon}
            selected={kinds.has(kind)}
            onSelectedChange={(on) => toggleKind(kind, on)}
          >
            {KINDS[kind].label} · {POSTS.filter((p) => p.kind === kind).length}
          </Chip>
        ))}
      </div>
      <div className="flex min-h-6 flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <span>Campaigns:</span>
        {campaigns.length === 0 ? <span>All</span> : null}
        {campaigns.map((c) => (
          <Tag key={c} onRemove={() => setCampaigns((prev) => prev.filter((x) => x !== c))}>
            {c}
          </Tag>
        ))}
        {campaigns.length === 0 ? (
          <Chip emphasis="outline" onClick={() => setCampaigns(["Launch"])}>
            Add “Launch”
          </Chip>
        ) : null}
        <span className="flex-1" />
        <Chip emphasis="outline" selected={loading} onSelectedChange={setLoading}>
          Simulate loading
        </Chip>
      </div>
      <ul className="flex flex-col divide-y divide-[var(--border-subtle)] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        {loading
          ? [0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 p-3" aria-hidden="true">
                <Skeleton className="size-8 rounded-md" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </li>
            ))
          : visible.map((post) => (
              <li key={post.id} className="flex min-w-0 items-center gap-3 p-3">
                <IconTile tone={KINDS[post.kind].tone} icon={KINDS[post.kind].icon} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm font-medium" title={post.title}>
                    {post.title}
                  </span>
                  <span className="flex min-w-0 flex-wrap gap-1">
                    <Tag tone={KINDS[post.kind].tone} emphasis="outline">
                      {KINDS[post.kind].label}
                    </Tag>
                    <Tag>{post.campaign}</Tag>
                  </span>
                </div>
                <StatusPill tone={post.status}>{post.statusLabel}</StatusPill>
              </li>
            ))}
        {!loading && visible.length === 0 ? (
          <li className="p-3">
            <EmptyState
              title="No posts match these filters"
              description="Clear a kind or a campaign to see more."
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setKinds(new Set());
                    setCampaigns([]);
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          </li>
        ) : null}
      </ul>
    </section>
  );
}

const meta: Meta = {
  title: "Primitives/Tag and Chip",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

/** Filter chips (toggle buttons with a check), removable campaign tags, kind tags, status pills. */
export const ContentBoardFilters: Story = {
  render: () => (
    <BothThemes>
      <ContentBoard />
    </BothThemes>
  ),
};

export const Loading: Story = {
  render: () => (
    <BothThemes>
      <ContentBoard initialState="loading" />
    </BothThemes>
  ),
};

/** Every categorical tone and neutral, at rest, selected and as an outline, beside the status set. */
export const ToneSet: Story = {
  render: () => {
    const tones = ["neutral", "violet", "orange", "teal", "blue", "pink", "brown", "cyan", "lime"] as const;
    return (
      <BothThemes>
        <div className="flex flex-col gap-3">
          {tones.map((tone) => (
            <div key={tone} className="flex flex-wrap items-center gap-2">
              <Tag tone={tone}>{tone}</Tag>
              <Tag tone={tone} emphasis="outline">
                outline
              </Tag>
              <Chip tone={tone} selected={false}>
                Off
              </Chip>
              <Chip tone={tone} selected>
                On
              </Chip>
              {tone !== "neutral" ? <IconTile tone={tone} name={`${tone} project`} size="sm" /> : null}
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            {(["success", "warning", "danger", "info", "running", "neutral"] as const).map((tone) => (
              <StatusPill key={tone} tone={tone}>
                {tone}
              </StatusPill>
            ))}
          </div>
        </div>
      </BothThemes>
    );
  },
};

/** Long and awkward labels truncate inside a narrow column instead of overflowing. */
export const WorstCase: Story = {
  render: () => (
    <BothThemes>
      <div className="flex w-full max-w-[220px] flex-col items-start gap-2">
        <Tag onRemove={() => {}}>supercalifragilistic.address+newsletter@extremely-long-domain.example.com</Tag>
        <Tag tone="teal">Research · Q4 enterprise procurement working group (EMEA)</Tag>
        <Chip tone="violet" selected>
          A filter whose label never ends because the account name is long
        </Chip>
        <Tag tone="pink">日本語のラベル</Tag>
        <Tag tone="lime">🚀 Launch</Tag>
        <Chip size="md">1</Chip>
      </div>
    </BothThemes>
  ),
};

const PART = "Adafruit-BME680-Temperature-Humidity-Pressure-Gas-Sensor-Breakout";

/** `wrap` keeps the whole label readable: one line matches a fixed tag's height; more lines grow it, with the icon and remove button on the first line. */
export const Wrap: Story = {
  render: () => (
    <BothThemes>
      <div className="flex w-full max-w-[220px] flex-col items-start gap-2" data-testid="wrap-column">
        {(["sm", "md"] as const).map((size) => (
          <div key={size} className="flex flex-col items-start gap-2">
            <div className="flex items-start gap-2">
              <Tag size={size} data-probe={`fixed-${size}`}>Short</Tag>
              <Tag size={size} wrap data-probe={`wrap-one-${size}`}>Short</Tag>
              <Tag size={size} wrap onRemove={() => {}} data-probe={`wrap-remove-${size}`}>Short</Tag>
            </div>
            <Tag size={size} wrap tone="teal" icon={<FileText />} onRemove={() => {}} data-probe={`wrap-long-${size}`}>
              {PART}
            </Tag>
          </div>
        ))}
      </div>
    </BothThemes>
  ),
};
