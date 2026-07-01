import type { Meta, StoryObj } from "@storybook/react";
import { InlineToolItem } from "../run/inline-tool-item";
import type { ToolPart } from "../types/parts";

const meta: Meta = {
  title: "Foundations/Theme Showcase",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const THEMES: { name: string; theme?: string }[] = [
  { name: "Tangle (neutral)", theme: undefined }, // default :root dark
  { name: "Tangle · light", theme: "tangle-light" },
  { name: "Aubergine (bazaar)", theme: "aubergine" },
  { name: "Aubergine · light", theme: "aubergine-light" },
  { name: "Experimental green", theme: "arena" },
  { name: "Experimental green · light", theme: "arena-light" },
];

const NOW = Date.now();

const themeToolParts: ToolPart[] = [
  {
    type: "tool",
    id: "theme-read",
    tool: "read",
    state: {
      status: "completed",
      input: { file_path: "src/batch-writer.ts" },
      time: { start: NOW - 3100, end: NOW - 2500 },
    },
  },
  {
    type: "tool",
    id: "theme-search",
    tool: "grep",
    state: {
      status: "completed",
      input: { pattern: "await sleep\\(" },
      time: { start: NOW - 2200, end: NOW - 1800 },
    },
  },
  {
    type: "tool",
    id: "theme-build",
    tool: "bash",
    state: {
      status: "error",
      input: { command: "pnpm test" },
      error: "1 failing test",
      time: { start: NOW - 1600, end: NOW - 400 },
    },
  },
];

function Cell({ name, theme }: { name: string; theme?: string }) {
  return (
    <div
      data-theme={theme}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground text-sm">{name}</span>
        <span className="font-medium text-muted-foreground text-xs">
          {theme?.includes("light") ? "Light" : "Dark"}
        </span>
      </div>

      <div className="space-y-1.5 rounded-xl border border-[var(--border-subtle)] bg-surface-container-high p-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" />
          <span className="font-semibold text-foreground text-xs">Agent</span>
          <span className="text-[11px] text-muted-foreground">4 tools · 3s</span>
        </div>
        {themeToolParts.map((part, index) => (
          <InlineToolItem
            key={part.id}
            part={part}
            groupPosition={index === 0 ? "first" : index === themeToolParts.length - 1 ? "last" : "middle"}
          />
        ))}
      </div>

      <p className="text-muted-foreground text-xs leading-relaxed">
        Body copy on the canvas. Surfaces separate by fill; the border is a quiet edge.
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-foreground text-xs"
        >
          Primary
        </button>
        <button
          type="button"
          className="rounded-lg border border-border bg-muted px-3 py-1.5 font-medium text-foreground text-xs"
        >
          Secondary
        </button>
      </div>
    </div>
  );
}

export const AllThemes: Story = {
  render: () => (
    <div className="min-h-screen bg-[#0a0a0c] p-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {THEMES.map((t) => (
          <Cell key={t.name} name={t.name} theme={t.theme} />
        ))}
      </div>
    </div>
  ),
};
