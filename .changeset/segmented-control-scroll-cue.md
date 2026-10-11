---
"@tangle-network/ui": minor
---

SegmentedControl: a strip whose options outgrow it now shows a chevron at each edge with options past it, instead of an edge fade that a host's inline padding or a cut between two options made invisible. The chevrons page the strip on click or tap and take no room in the row. The selected option is kept fully in view clear of the chevrons, and this now also works for a row control a host made scroll with `flex-nowrap overflow-x-auto`.
