---
"@tangle-network/ui": major
---

One composer, no zombie API. `ChatInput` is deleted — the canonical composer is `AgentComposer` in `@tangle-network/sandbox-ui`, composed below the transcript by the app. `ChatContainer` is now transcript-only: the input props (`onSend`, `onCancel`, `placeholder`, `hideInput`, `modelLabel`, `onModelClick`, `pendingFiles`, `onRemoveFile`, `onAttach`, `disabled`) and the `PendingFile` type are removed. `ChatMessage` drops the no-op `avatar`/`hideAvatar` props. `ToolCallStep`/`ToolCallGroup` are no longer exported (internal adapters over `InlineToolItem`); the `ToolCallType`/`ToolCallStatus` types stay public via `ToolCallData`, and `ToolCallFeed` is unchanged.
