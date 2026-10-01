# Shared chat inverse bubbles: Storybook receipt

The before images show `main` at `6c2127b`.
The after images show the change in this branch.
All images came from the real Storybook iframe in Chromium on drew-gtr-pro on 2026-10-01.
The stories use synthetic conversation content and the Brand light and dark theme globals.

| Surface | Theme and viewport | Before | After |
| --- | --- | --- | --- |
| `AgentTimeline` coding session | Light, 1440 × 900 | [Before](before-timeline-light-desktop.png) | [After](after-timeline-light-desktop.png) |
| `AgentTimeline` coding session | Dark, 390 × 844 | [Before](before-timeline-dark-mobile.png) | [After](after-timeline-dark-mobile.png) |
| `ChatMessage` conversation | Light, 1440 × 900 | [Before](before-chatmessage-light-desktop.png) | [After](after-chatmessage-light-desktop.png) |
| `ChatMessage` conversation | Dark, 390 × 844 | [Before](before-chatmessage-dark-mobile.png) | [After](after-chatmessage-dark-mobile.png) |

[MessageList with user messages](after-messagelist-light-desktop.png) confirms that the session renderer shares the inverse bubble.
[UserMessage with an action](after-usermessage-actions-dark-mobile.png) confirms that the action stays outside the bubble.
Status, tool, and artifact cards keep their own surfaces in the AgentTimeline images.
The dark mobile `ChatMessage` code block clips horizontally in both before and after images.

Chromium computed the user bubble colors as `rgb(234, 234, 234)` text on `rgb(45, 45, 45)` in light mode, a contrast ratio of 11.45:1.
In dark mode it computed `rgb(22, 22, 22)` text on `rgb(230, 230, 230)`, a ratio of 14.50:1.
Both values were observed in the `AgentTimeline` and `ChatMessage` stories.
