# Brand, UI, and Charts

Keep shared design tokens, components, and chart behavior in their owning packages.
Choose checks for the changed package and surface; instruction-only changes need diff and link checks.
Reuse passing checks while their inputs remain unchanged.
Honor explicit hosted-CI waivers while preserving hooks and enforced branch protections.
Fix change-caused failures; record unrelated or infrastructure failures as owned follow-ups.
Own authorized push, PR, conflict resolution, review, merge, and release.
For package releases, verify the tested artifact was published through the maintained workflow.
When the task includes application adoption, finish the dependency update and verify the served consumer.

For product-wide design work, read [Brand guidelines](docs/brand-guidelines.md)
and the proposed [reference-journey refresh brief](docs/design-refresh.md).
The guidelines own shared visual decisions; the refresh brief is a delivery proposal,
not an approved replacement theme. Improve complete consumer journeys before
extracting new primitives. Keep product positioning with its owning product.
