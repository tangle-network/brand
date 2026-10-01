# AgentTimeline tone contrast

The `StatusTones` and `ErrorArtifact` Storybook stories render the actual `AgentTimeline` component.

The host light capture sets `--color-muted-foreground` to `rgb(90 108 98)` and the danger surface to `#733b36` with text `#ffada9`.
Those values reproduce the Hospitality failure card without its consumer CSS override.
The default dark capture uses the package's standard dark tokens.

| Status detail | Host light contrast | Default dark contrast |
| --- | ---: | ---: |
| Default | 5.59:1 | 6.47:1 |
| Info | 5.57:1 | 4.90:1 |
| Success | 5.21:1 | 4.92:1 |
| Warning | 5.25:1 | 5.28:1 |
| Error | 4.90:1 | 4.90:1 |

Before the shared fix, the four colored dark card details used the host muted color and measured 1.56–1.58:1.
The error artifact title, description, and metadata now use the same danger foreground as its card label.
