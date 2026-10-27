import type { Meta, StoryObj } from "@storybook/react";

// Each data-accent scope inside an explicit .dark and .light boundary and two
// named themes: fill, ink, focus border, selection, mark and line follow the
// hue while the card, body ink and status stay the theme's.
const HUES = ["violet", "orange", "teal", "blue", "pink", "brown", "cyan", "lime"] as const;

function Island({ accent, theme, label }: { accent?: string; theme?: string; label: string }) {
  return (
    <section data-accent={accent} data-theme={theme} className="rounded-[var(--radius-card)] border border-border bg-card p-3 text-foreground">
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="h-8 rounded-[var(--radius-control)] bg-primary px-3 text-sm font-medium text-primary-foreground">
          Run
        </button>
        <span className="text-sm font-medium text-[var(--accent-text)]">Accent ink</span>
        <span className="h-8 w-14 rounded-[var(--radius-control)] border border-[var(--focus-border)] shadow-[0_0_0_3px_var(--focus-halo)]" />
        <span className="rounded-[var(--radius-pill)] bg-[var(--bg-selection)] px-2 py-0.5 text-xs">Selected</span>
        <span className="size-4 rounded-full bg-[var(--brand-primary)]" />
        <span className="w-8 border-t-2 border-[var(--brand-cool)]" />
        <span className="text-xs text-[var(--surface-success-text)]">Done</span>
      </div>
    </section>
  );
}

function Mode({ mode }: { mode: "dark" | "light" }) {
  return (
    <div className={`${mode} bg-background p-4`} data-mode={mode}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Island label="indigo (no accent)" />
        {HUES.map((hue) => (
          <Island key={hue} accent={hue} label={hue} />
        ))}
      </div>
    </div>
  );
}

const meta: Meta = { title: "Brand/Accent scopes", parameters: { layout: "fullscreen" } };
export default meta;

export const AllHues: StoryObj = {
  render: () => (
    <div>
      <Mode mode="dark" />
      <Mode mode="light" />
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <Island theme="aubergine" accent="pink" label="pink inside aubergine" />
        <Island theme="super-light" accent="teal" label="teal inside super-light" />
      </div>
    </div>
  ),
};
