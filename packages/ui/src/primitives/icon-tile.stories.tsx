import type { Meta, StoryObj } from "@storybook/react";
import { Folder, Globe } from "lucide-react";
import type { ReactNode } from "react";
import { IconTile } from "./icon-tile";

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

// A 1x1 transparent PNG stands in for a loaded logo; the second URL never
// resolves, so that row shows the fallback a broken favicon gets.
const LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const PROJECTS: { name: string; src?: string; icon?: ReactNode; note: string }[] = [
  { name: "Acme Robotics", src: LOGO, note: "Image" },
  { name: "Northwind Traders", src: "https://logo.invalid/northwind.png", note: "Broken image → initials" },
  { name: "Website", icon: <Globe />, note: "Glyph" },
  { name: "Shared drive", icon: <Folder />, note: "Glyph" },
  { name: "Quarterly enterprise procurement working group for the EMEA region", note: "Long name → initials" },
  { name: "x", note: "One letter" },
  { name: "李 小龍", note: "Non-Latin" },
];

const meta: Meta<typeof IconTile> = {
  title: "Primitives/IconTile",
  component: IconTile,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof IconTile>;

/** A project list: the tone comes from the name, so a project keeps its colour everywhere. */
export const ProjectList: Story = {
  render: () => (
    <BothThemes>
      <ul className="flex flex-col gap-2">
        {PROJECTS.map((p) => (
          <li key={p.name} className="flex min-w-0 items-center gap-3">
            <IconTile name={p.name} src={p.src} icon={p.icon} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
            <span className="shrink-0 text-xs text-[var(--text-muted)]">{p.note}</span>
          </li>
        ))}
      </ul>
    </BothThemes>
  ),
};

export const Sizes: Story = {
  render: () => (
    <BothThemes>
      <div className="flex items-end gap-3">
        {(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((size) => (
          <IconTile key={size} size={size} name="Tangle Network" />
        ))}
        {(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((size) => (
          <IconTile key={`g-${size}`} size={size} tone="cyan" icon={<Globe />} />
        ))}
      </div>
    </BothThemes>
  ),
};
