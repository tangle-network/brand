import { describe, expect, it } from "vitest";
import { mapPlainChatMessages } from "./plain-messages";

describe("mapPlainChatMessages", () => {
  it("maps role, content, and model into session messages and text parts", () => {
    const { messages, partMap } = mapPlainChatMessages([
      { role: "user", content: "Hello", id: "u1" },
      { role: "assistant", content: "Hi there", model: "acme/fast", id: "a1" },
    ]);

    expect(messages).toEqual([
      { id: "u1", role: "user", _insertionIndex: 0 },
      { id: "a1", role: "assistant", model: "acme/fast", _insertionIndex: 1 },
    ]);
    expect(partMap).toEqual({
      u1: [{ type: "text", text: "Hello" }],
      a1: [{ type: "text", text: "Hi there" }],
    });
  });

  it("assigns ordered ids when the caller omits them", () => {
    const { messages, partMap } = mapPlainChatMessages([
      { role: "system", content: "Rules" },
      { role: "user", content: "Go" },
    ]);

    expect(messages.map((m) => m.id)).toEqual(["msg-0", "msg-1"]);
    expect(partMap["msg-0"]).toEqual([{ type: "text", text: "Rules" }]);
    expect(partMap["msg-1"]).toEqual([{ type: "text", text: "Go" }]);
  });

  it("returns empty collections for an empty input", () => {
    expect(mapPlainChatMessages([])).toEqual({ messages: [], partMap: {} });
  });
});
