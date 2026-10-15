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
 it("blocks duplicate writes until the accepted operation settles",async()=>{
  const updates=vi.fn();let complete!:()=>void;
  const write=vi.fn(()=>new Promise<void>(resolve=>{complete=resolve;}));
  const feedback=createCopyFeedback(updates,write);
  const first=feedback.copy("first");await feedback.copy("duplicate");
  expect(write.mock.calls).toEqual([["first"]]);
  expect(updates).toHaveBeenLastCalledWith({copied:false,status:"Copying to clipboard",pending:true});
  complete();await first;
  expect(updates).toHaveBeenLastCalledWith({copied:true,status:"Copied to clipboard",pending:false});
  const next=feedback.copy("next");expect(write).toHaveBeenCalledTimes(2);complete();await next;
  feedback.dispose();await feedback.copy("disposed");expect(write).toHaveBeenCalledTimes(2);
 });
 it("retains exact newlines and plain binary/SSE text",async()=>{
  const text='data: {"delta":"<x>"}\n\ndata: [DONE]\n';const lines=await highlightCode(text,"text");expect(lines.map(line=>line.map(t=>t.content).join("")).join("\n")).toBe(text);
 });
});
