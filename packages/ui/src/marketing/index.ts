// Marketing-site components shared by tangle.tools and sandbox.tangle.tools. Each takes its content as props.
export { ExampleEditor, type Idea as ExampleIdea, type Subject as ExampleSubject } from "./example-editor";
export type { RunMeta as ExampleRun } from "./run-replay";
export { SiteNav, type SiteNavProps, type SiteLink } from './site-nav';
export { SiteFooter, type SiteFooterProps } from './site-footer';
export { Section, type SectionProps } from './section';
export { InstallRow } from './install-row';
export { RunTrace, type RunTraceProps } from './run-trace';
export { HarnessStrip, type HarnessStripProps, type Harness, type HarnessCapture } from './harness-strip';
export { TerminalReplay, type TerminalReplayProps } from './terminal-replay';
export { CliPlayground, type CliPlaygroundProps, type CliCommand } from './cli-playground';
export { UseCaseCards, type UseCaseCardsProps, type UseCase } from './use-case-cards';
export { LatencyPanel } from './latency-panel';
export { BillingProof, type BillingProofProps } from './billing-proof';
export { PlanTable, type PlanTableProps } from './plan-table';
export { InstallCloser, type InstallCloserProps } from './install-closer';
