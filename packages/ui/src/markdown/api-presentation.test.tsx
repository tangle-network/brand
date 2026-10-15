import { fireEvent,render,screen } from "@testing-library/react";
import { describe,it,expect,vi } from "vitest";
import { CodeBlock } from "./code-block";
import { ApiSchema } from "./api-schema";
import { createCopyFeedback,highlightCode } from "../code-presentation";
describe("shared API presentation",()=>{
 it("renders field paths without turning schema text into HTML",()=>{
  render(<ApiSchema fields={[{name:"messages",type:"array",children:[{name:"content",type:"string",description:"<script>bad()</script>"}]}]}/>);
  expect(screen.getByText("messages.content")).toBeInTheDocument();expect(document.querySelector("script")).toBeNull();
 });
 it("keeps stale clipboard completions and disposed feedback silent",async()=>{
  const updates=vi.fn();let complete!:()=>void;const feedback=createCopyFeedback(updates,()=>new Promise<void>(resolve=>{complete=resolve;}));
  const pending=feedback.copy("bytes");feedback.dispose();complete();await pending;expect(updates).toHaveBeenCalledTimes(1);
 });
 it("retains exact newlines and plain binary/SSE text",async()=>{
  const text='data: {"delta":"<x>"}\n\ndata: [DONE]\n';const lines=await highlightCode(text,"text");expect(lines.map(line=>line.map(t=>t.content).join("")).join("\n")).toBe(text);
 });
});
