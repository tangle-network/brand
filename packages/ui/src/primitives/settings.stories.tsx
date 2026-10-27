import { Bell, Bot, Check, CreditCard, Inbox, Loader2, Settings, Users, Workflow } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarFallback } from "./avatar";
import { Button } from "./button";
import { Card } from "./card";
import { Field, fieldMessageId } from "./field";
import { Input, Textarea } from "./input";
import { Metric, MetricStrip } from "./metric-strip";
import { PageHeader } from "./page-header";
import { PageShell } from "./page-shell";
import { SegmentedControl } from "./segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { SettingsList, SettingsListItem, SettingsNote, SettingsRow, SettingsSection } from "./settings";
import type { StatusTone } from "./status-pill";
import { Switch } from "./switch";
import { bindSettingsNav } from "../presentation";

/** Example data only: no routing, persistence or fetching. Every state is drawn at once so one screenshot shows them all. */

const SECTIONS = [
  { id: "general", label: "General", icon: Settings },
  { id: "agent", label: "Agent", icon: Bot },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "automations", label: "Automations", icon: Workflow },
  { id: "leads", label: "Inbound leads", icon: Inbox },
  { id: "team", label: "Team", icon: Users, count: 4 },
  { id: "billing", label: "Ad spend", icon: CreditCard },
] as const;

function Saving() {
  return <><Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />Saving…</>;
}

function Saved() {
  return <span className="inline-flex items-center gap-1 text-[var(--surface-success-text)]"><Check aria-hidden="true" className="size-4" />Saved</span>;
}

interface Automation { name: string; meta: string; state: string; verb: string; ownerOnly?: boolean; error?: string }

const AUTOMATION_TONE: Record<string, StatusTone> = { Active: "success", Paused: "neutral", "Couldn't start": "danger" };

const automations: Automation[] = [
  { name: "Weekly competitor scan", meta: "Mondays at 09:00", state: "Active", verb: "Pause" },
  { name: "Inbound lead triage", meta: "When a signed webhook arrives", state: "Paused", verb: "Resume", ownerOnly: true },
  { name: "Daily brief", meta: "Every day at 08:00 · Europe/Berlin", state: "Couldn't start", verb: "Try again", error: "Platform didn't respond. Nothing ran; try again." },
];

/** Pause turns an automation off; Resume and Try again turn it back on. */
function runVerb(job: Automation): Automation {
  return job.state === "Active" ? { ...job, state: "Paused", verb: "Resume" } : { ...job, state: "Active", verb: "Pause", error: undefined };
}

const members = [
  { name: "Priya Raman", email: "priya@fieldnote.example", role: "owner" },
  { name: "Jonas Weber", email: "jonas@fieldnote.example", role: "admin" },
  { name: "Ana Lima", email: "ana.lima.growth-operations-team@fieldnote-analytics.example", role: "editor" },
];

const roles = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Can manage settings and people" },
  { value: "editor", label: "Can edit and chat" },
  { value: "viewer", label: "Can only view" },
];

interface SettingsPageProps {
  /** Only the first two sections render at first; the rest arrive 300ms later, as role-gated sections do. */
  sectionsLoadLater?: boolean;
  /** Leave out the section navigation. */
  withoutNavigation?: boolean;
  className?: string;
}

function SettingsPage({ sectionsLoadLater = false, withoutNavigation = false, className }: SettingsPageProps) {
  const [current, setCurrent] = useState("team");
  const [sections, setSections] = useState<readonly (typeof SECTIONS)[number][]>(sectionsLoadLater ? SECTIONS.slice(0, 2) : SECTIONS);
  useEffect(() => {
    if (!sectionsLoadLater) return;
    const loaded = setTimeout(() => setSections(SECTIONS), 300);
    return () => clearTimeout(loaded);
  }, [sectionsLoadLater]);
  const [name, setName] = useState("Fieldnote GTM");
  const [digest, setDigest] = useState(true);
  const [approval, setApproval] = useState("each");
  const [jobs, setJobs] = useState(automations);
  const [roleOf, setRoleOf] = useState<Record<string, string>>(Object.fromEntries(members.map((m) => [m.email, m.role])));

  const navigation = withoutNavigation ? undefined : sections.map((section) => {
    const Icon = section.icon;
    return (
      <a key={section.id} href={`#${section.id}`} aria-current={current === section.id ? "page" : undefined} onClick={() => setCurrent(section.id)}>
        <Icon aria-hidden="true" />
        <span>{section.label}</span>
        {"count" in section && <span data-count="">{section.count}</span>}
      </a>
    );
  });

  return (
    <PageShell
      measure="settings"
      className={className}
      navigationLabel="Settings sections"
      header={<PageHeader title="Project settings" description="Fieldnote GTM" />}
      navigation={navigation}
      article={<>
        <SettingsSection id="general" title="General">
          <SettingsRow label="Project name" htmlFor="project-name" status={<Saved />}>
            <Input id="project-name" value={name} onChange={(event) => setName(event.target.value)} />
          </SettingsRow>
          <SettingsRow label="Timezone" htmlFor="timezone" description="Moves the digest hour; scheduled posts never move." info="Dates in chats, emails and exports use this zone.">
            <Select defaultValue="berlin">
              <SelectTrigger id="timezone" aria-describedby={fieldMessageId("timezone")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="berlin">Europe/Berlin (UTC+2)</SelectItem>
                <SelectItem value="new-york">America/New_York (UTC−4)</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>
          <SettingsRow label="Business brief" layout="compact">
            <Button type="button" variant="outline">Edit brief</Button>
          </SettingsRow>
          <SettingsRow label="Custom instructions" htmlFor="instructions" layout="stacked" status={<Saving />} description="Applies to new chats and the next automation run.">
            <Textarea id="instructions" defaultValue="Write in plain English. Never promise delivery dates." />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection id="notifications" title="Notifications" description="Daily digest and approval notices go to the owner.">
          <SettingsRow label="Daily digest" htmlFor="digest" layout="compact">
            <Switch id="digest" checked={digest} onCheckedChange={setDigest} />
          </SettingsRow>
          <SettingsRow label="Approval notices" htmlFor="approval-mode">
            <SegmentedControl
              id="approval-mode"
              aria-label="Approval notices"
              value={approval}
              onValueChange={setApproval}
              options={[{ value: "each", label: "Each request" }, { value: "daily", label: "Once a day" }, { value: "never", label: "Never" }]}
            />
          </SettingsRow>
          <SettingsRow label="Digest hour" htmlFor="digest-hour" error="Couldn't save the digest hour." onRetry={() => undefined}>
            <Input id="digest-hour" defaultValue="08:00" />
          </SettingsRow>
          <SettingsRow label="Texting phone" htmlFor="texting-phone" disabledReason="Only Priya, the owner, can change the texting phone.">
            <Input id="texting-phone" defaultValue="+1 (555) 010-0199" disabled />
          </SettingsRow>
          <SettingsRow label="Send today's digest" layout="compact">
            <Button type="button" variant="outline">Send now</Button>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection id="automations" title="Automations" info="Automations run on the project's agent and are billed as compute." actions={<Button type="button" variant="outline">New automation</Button>}>
          <SettingsList aria-label="Automations" columns={{ status: "8rem", action: "9rem" }}>
            {jobs.map((job) => (
              <SettingsListItem
                key={job.name}
                title={<a href={`#${job.name}`}>{job.name}</a>}
                meta={job.meta}
                status={job.state}
                tone={AUTOMATION_TONE[job.state]}
                error={job.error}
                action={{
                  label: job.verb,
                  onSelect: () => setJobs((all) => all.map((each) => (each.name === job.name ? runVerb(each) : each))),
                  disabledReason: job.ownerOnly ? "Only Priya, the owner, can resume it." : undefined,
                }}
                menu={[
                  { label: "Duplicate", onSelect: () => undefined },
                  job.ownerOnly
                    ? { label: "Delete", tone: "danger", onSelect: () => undefined, disabledReason: "Only Priya, the owner, can delete it." }
                    : { label: "Delete", tone: "danger", onSelect: () => undefined },
                ]}
              />
            ))}
          </SettingsList>
        </SettingsSection>

        <SettingsSection id="team" title="Members" actions={<Button type="button">Invite</Button>}>
          <SettingsList aria-label="Members" columns={{ leading: "32px", status: "18rem", menu: "36px" }}>
            {members.map((member) => {
              const roleId = `role-${member.email}`;
              return (
                <SettingsListItem
                  key={member.email}
                  leading={<Avatar size="sm"><AvatarFallback>{member.name.split(" ").map((part) => part[0]).join("")}</AvatarFallback></Avatar>}
                  title={member.name}
                  meta={member.email}
                  status={member.role === "owner" ? <span className="text-foreground">Owner</span> : (
                    <Select value={roleOf[member.email]} onValueChange={(role) => setRoleOf((all) => ({ ...all, [member.email]: role }))}>
                      <SelectTrigger id={roleId} aria-label={`Role for ${member.name}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {roles.filter((role) => role.value !== "owner").map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  menu={member.role === "owner" ? undefined : [{ label: "Remove from project", tone: "danger", onSelect: () => undefined }]}
                />
              );
            })}
          </SettingsList>
        </SettingsSection>

        <SettingsSection
          id="billing"
          title="Ad spend caps"
          description="Ads pause when a cap is reached."
          footer={<>
            <span className="text-muted-foreground">2 unsaved changes</span>
            <span className="ml-auto flex gap-2">
              <Button type="button" variant="ghost">Discard</Button>
              <Button type="button">Save caps</Button>
            </span>
          </>}
        >
          <SettingsRow label="Daily cap" htmlFor="daily-cap"><Input id="daily-cap" defaultValue="$40" /></SettingsRow>
          <SettingsRow label="Monthly cap" htmlFor="monthly-cap"><Input id="monthly-cap" defaultValue="$900" /></SettingsRow>
        </SettingsSection>

        <SettingsSection id="delete" tone="danger" title="Delete project" description="Deletes every chat, vault file and automation for everyone." actions={<Button type="button" variant="destructive-outline">Delete project…</Button>} />
      </>}
    />
  );
}

function FieldsExample() {
  const [model, setModel] = useState("claude-sonnet");
  return (
    <div className="mx-auto max-w-xl p-6">
      <Card className="space-y-4 p-4">
        <Field label="Display name" htmlFor="display-name" hint="Use 40 characters or fewer.">
          <Input id="display-name" defaultValue="Research agent" aria-describedby={fieldMessageId("display-name")} />
        </Field>
        <Field label="Default model" htmlFor="default-model" info="Replaces the profile's model for new chats." aside={<Button type="button" variant="ghost">Use default</Button>}
          error={model.startsWith("claude") ? "This project's catalog refuses Anthropic models. Pick another." : undefined}>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="default-model" aria-invalid={model.startsWith("claude") || undefined} aria-describedby={fieldMessageId("default-model")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-sonnet">claude-sonnet</SelectItem>
              <SelectItem value="gpt-6.1-sol">gpt-6.1-sol</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Webhook URL" htmlFor="webhook" status="Reachable: the last check returned 200.">
          <Input id="webhook" defaultValue="https://hooks.fieldnote.example/gtm/leads" aria-describedby={fieldMessageId("webhook")} />
        </Field>
      </Card>
    </div>
  );
}

/** Read-only product data beside existing controls; all values here are sample data. */
function SettingsValuesExample() {
  const [details, setDetails] = useState(false);
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <SettingsSection id="read-only-values" title="Account values">
        <SettingsRow id="value-zero" label="Active sessions" value={0} layout="compact" />
        <SettingsRow id="value-empty" label="Empty value" value="" layout="compact" />
        <SettingsRow id="value-false" label="False value" value={false} layout="compact" />
        <SettingsRow id="value-null" label="Null value" value={null} layout="compact" />
        <SettingsRow id="value-undefined" label="Undefined value" value={undefined} layout="compact" />
        <SettingsRow id="value-mixed" label="Projected monthly cost" value={<>$0.00 <span className="text-muted-foreground">/month</span></>} layout="compact" />
        <SettingsRow id="value-long" label="Session identifier" value="session_with_a_long_unbroken_identifier_that_must_wrap_inside_its_settings_card_without_hiding_the_label_or_overflowing" mono layout="compact" />
        <SettingsRow id="value-agent" label="Agent identifier" value="research-agent" mono layout="compact" />
        <SettingsRow id="value-model" label="Model identifier" value="workspace-model" mono layout="compact" />
        <SettingsRow id="value-provider" label="Provider identifier" value="workspace-provider" mono layout="compact" />
        <SettingsRow id="value-stacked" label="Stacked summary" value="Workspace summary" layout="stacked" />
        <SettingsRow id="value-action" label="Value with action" value="workspace-provider" status={details ? "Details shown" : undefined} layout="compact">
          <Button type="button" variant="outline" onClick={() => setDetails((shown) => !shown)}>{details ? "Hide details" : "Show details"}</Button>
        </SettingsRow>
        <SettingsRow id="value-control" label="Value with input" value="UTC" htmlFor="value-timezone" description="The original input keeps its message wiring.">
          <Input id="value-timezone" defaultValue="UTC" />
        </SettingsRow>
      </SettingsSection>
      <div className="max-w-sm">
        <SettingsSection id="narrow-values" title="Narrow card in any window">
          <SettingsRow id="narrow-value" label="Account email" value="reader@workspace.example" layout="compact" />
          <SettingsRow id="legacy-compact" label="Daily digest" htmlFor="value-digest" layout="compact"><Switch id="value-digest" defaultChecked /></SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}

const webhooks: Array<{ url: string; events: string[]; state: string; tone: StatusTone }> = [
  { url: "https://hooks.fieldnote-analytics.example/intelligence/v1/trace-events", events: ["trace.completed", "eval.regressed", "budget.exceeded"], state: "Active", tone: "success" },
  { url: "https://ops.fieldnote.example/alerts/webhooks/intelligence_regressions", events: ["eval.regressed"], state: "Inactive", tone: "neutral" },
  { url: "https://n8n.fieldnote.example/webhook/7f3c2a91-5d4e-4b8a-9c61-2e0f8d7a4b13", events: ["budget.exceeded", "alert.triggered"], state: "Failing", tone: "danger" },
];

const alertRules: Array<{ name: string; rule: string; severity: string; tone: StatusTone }> = [
  { name: "Error rate", rule: "Above 5% for 10 minutes", severity: "Critical", tone: "danger" },
  { name: "p95 latency", rule: "Above 4 s for 15 minutes", severity: "Warning", tone: "warning" },
  { name: "Daily spend", rule: "Above $40 in a day", severity: "Notice", tone: "neutral" },
];

/** Notes (figure, empty, loading, notice, refusal), toned list states, and long URLs and event names in narrow columns. */
function NotesAndTonesExample() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 max-sm:p-4">
      <SettingsSection id="webhooks" title="Webhooks" description="Signed POSTs when traces, evals or budgets change.">
        <SettingsNote>
          <MetricStrip columns={2} aria-label="Last 7 days">
            <Metric label="Deliveries" value="1,284" hint="Last 7 days" />
            <Metric label="Failed" value="3" hint="Each retried 5 times" />
          </MetricStrip>
        </SettingsNote>
        <SettingsList aria-label="Webhook endpoints" columns={{ status: "7rem", action: "8rem", menu: "36px" }}>
          {webhooks.map((hook) => (
            <SettingsListItem
              key={hook.url}
              title={<a href={`#${hook.state}`}>{hook.url}</a>}
              meta={hook.events.join(", ")}
              status={hook.state}
              tone={hook.tone}
              action={{ label: "Send test", onSelect: () => undefined }}
              menu={[{ label: "Delete…", tone: "danger", onSelect: () => undefined }]}
            />
          ))}
        </SettingsList>
        <SettingsNote tone="warning" role="status">One endpoint failed its last three deliveries. It pauses after five.</SettingsNote>
      </SettingsSection>
      <SettingsSection id="alert-rules" title="Alert rules">
        <SettingsList aria-label="Alert rules" columns={{ status: "7rem", menu: "36px" }}>
          {alertRules.map((rule) => (
            <SettingsListItem key={rule.name} title={rule.name} meta={rule.rule} status={rule.severity} tone={rule.tone} menu={[{ label: "Delete…", tone: "danger", onSelect: () => undefined }]} />
          ))}
        </SettingsList>
      </SettingsSection>
      <SettingsSection id="saved-versions" title="Saved versions">
        <SettingsNote tone="muted">No saved versions yet.</SettingsNote>
        <SettingsNote tone="muted" role="status"><span className="inline-flex items-center gap-1.5"><Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />Loading saved versions…</span></SettingsNote>
        <SettingsNote tone="danger" role="alert">Couldn't load saved versions. The workspace didn't answer; nothing changed.</SettingsNote>
      </SettingsSection>
    </div>
  );
}

const HOST_SECTIONS = [["account", "Account"], ["keys", "API keys"], ["usage", "Usage"], ["billing", "Billing"], ["webhooks", "Webhooks"], ["team", "Team"]] as const;

/** What a server-rendered host such as tangle-router writes: PageShell's settings markup, with no React inside it. */
const HOST_MARKUP = `<div class="tangle-settings-frame" style="--tangle-settings-sticky-top: var(--shell-header-height)">
<div class="tangle-reading-shell" data-measure="settings">
<div class="tangle-reading-header"><h1 class="tangle-heading" data-variant="section">Settings</h1></div>
<nav aria-label="Settings sections" class="tangle-reading-nav"><ul role="list">${HOST_SECTIONS.map(([id, label]) => `<li><a href="/settings-doc/${id}"${id === "usage" ? ' aria-current="page"' : ""}>${label}</a></li>`).join("")}</ul></nav>
<article class="tangle-reading-article">${["Usage", "Limits", "Sources"].map((name) => `<section role="region" aria-label="${name}" data-slot="card" class="rounded-[var(--radius-lg)] border border-border bg-card p-5" style="min-height: 28rem"><h2 class="font-semibold">${name}</h2></section>`).join("")}</article>
</div></div>`;

/** A host whose document scrolls under its own sticky header, with server markup bound by bindSettingsNav. */
function ServerRenderedHostExample() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const nav = root.current?.querySelector<HTMLElement>("nav");
    return nav ? bindSettingsNav(nav) : undefined;
  }, []);
  return (
    <>
      <header className="sticky top-0 z-10 flex h-[var(--shell-header-height)] items-center border-b border-border bg-background px-6 font-medium text-sm">Host header</header>
      <div ref={root} dangerouslySetInnerHTML={{ __html: HOST_MARKUP }} />
    </>
  );
}

const meta = {
  title: "Primitives/Settings",
  component: SettingsSection,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SettingsSection>;
export default meta;
type Story = StoryObj<typeof SettingsSection>;

/** Every settings atom state on one page in PageShell measure="settings"; resize to see the nav switch at 60rem and rows stack at 34rem. */
export const Page: Story = { render: () => <SettingsPage /> };

/** The sections a role gates load after the page renders; on a phone the strip still centres the current tab when it arrives. */
export const SectionsLoadLater: Story = { render: () => <SettingsPage sectionsLoadLater /> };

/** A settings page with no section navigation is the 48rem column alone at every width. */
export const WithoutNavigation: Story = { render: () => <SettingsPage withoutNavigation /> };

/** className bounds the frame the layout answers to, so a 42rem page in a wide window gets the tab strip. */
export const Bounded: Story = { render: () => <SettingsPage className="mx-auto max-w-2xl" /> };

/** The promoted Field: hint, info tip with an aside action, a live error, and a status. */
export const Fields: Story = { render: () => <FieldsExample /> };

/** Values preserve ReactNode content and coexist with controls; only value rows stack in a narrow compact layout. */
export const Values: Story = { render: () => <SettingsValuesExample /> };

/** Every line that is not a row, list states in their tone, and long URLs and event names wrapping whole at 390. */
export const NotesAndTones: Story = { render: () => <NotesAndTonesExample /> };

/** tangle-router's case: server-rendered settings markup under a sticky host header, bound with bindSettingsNav. */
export const ServerRenderedHost: Story = { render: () => <ServerRenderedHostExample /> };
