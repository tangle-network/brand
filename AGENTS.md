# Brand, UI, and Charts

Keep shared design tokens, components, and chart behavior in their owning packages.
Choose checks for the changed package and surface; instruction-only changes need diff and link checks.
Reuse passing checks while their inputs remain unchanged.
Honor explicit hosted-CI waivers while preserving hooks and enforced branch protections.
Fix change-caused failures; record unrelated or infrastructure failures as owned follow-ups.
Own authorized push, PR, conflict resolution, review, merge, and release.
For package releases, verify the tested artifact was published through the maintained workflow.
When the task includes application adoption, finish the dependency update and verify the served consumer.

For product design, start with the [design bible's creation process](docs/design-bible.md#from-intent-to-a-working-product), then use the [Brand guidelines](docs/brand-guidelines.md).
The [reference-journey brief](docs/design-refresh.md) applies the process across products.
Build and critique complete journeys with useful defaults before extracting new primitives.
Keep measurement in the existing [evidence contract](docs/design-evidence-contract.md), not a new gate or duplicated policy.
