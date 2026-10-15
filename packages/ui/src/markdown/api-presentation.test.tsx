import { fireEvent,render,screen } from "@testing-library/react";
import { describe,it,expect,vi } from "vitest";
import { CodeBlock } from "./code-block";
import { ApiSchema } from "./api-schema";
import { bindCopyButton,createCopyFeedback,highlightCode } from "../code-presentation";
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
  expect(updates).toHaveBeenLastCalledWith(expect.objectContaining({copied:false,status:"Copying to clipboard",pending:true}));
  complete();await first;
  expect(updates).toHaveBeenLastCalledWith(expect.objectContaining({copied:true,status:"Copied to clipboard",pending:false}));
  const next=feedback.copy("next");expect(write).toHaveBeenCalledTimes(2);complete();await next;
  feedback.dispose();await feedback.copy("disposed");expect(write).toHaveBeenCalledTimes(2);
 });
 it("retains exact newlines and plain binary/SSE text",async()=>{
  const text='data: {"delta":"<x>"}\n\ndata: [DONE]\n';const lines=await highlightCode(text,"text");expect(lines.map(line=>line.map(t=>t.content).join("")).join("\n")).toBe(text);
 });
});

describe("copy binding cleanup",()=>{
 it.each(["pending","success","failure"])("restores retained DOM after %s",async phase=>{
  const descriptor=Object.getOwnPropertyDescriptor(navigator,"clipboard");
  let resolve!:()=>void,reject!:(error:Error)=>void;
  const writeText=vi.fn(()=>new Promise<void>((yes,no)=>{resolve=yes;reject=no;}));
  Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText}});
  const button=document.createElement("button"),status=document.createElement("span");
  button.setAttribute("aria-label","Copy request");status.textContent="Ready";
  const cleanup=bindCopyButton(button,status,()=>"exact bytes");
  try {
   button.click();expect(button.getAttribute("aria-label")).toBe("Copying to clipboard");
   if(phase!=="pending"){
    if(phase==="failure")reject(new Error("Denied"));else resolve();
    await vi.waitFor(()=>expect(button.getAttribute("aria-label")).toBe(phase==="failure"?"Copy to clipboard":"Copied"));
   }
   cleanup();
   expect(button.getAttribute("aria-label")).toBe("Copy request");expect(status.textContent).toBe("Ready");
   resolve();await Promise.resolve();await Promise.resolve();
   expect(button.getAttribute("aria-label")).toBe("Copy request");expect(status.textContent).toBe("Ready");
  }finally{
   cleanup();if(descriptor)Object.defineProperty(navigator,"clipboard",descriptor);else delete (navigator as {clipboard?:unknown}).clipboard;
  }
 });
 it("restores an originally absent accessible label",()=>{
  const button=document.createElement("button"),status=document.createElement("span");
  const cleanup=bindCopyButton(button,status,()=>"bytes");button.setAttribute("aria-label","Copied");cleanup();expect(button.hasAttribute("aria-label")).toBe(false);
 });
 it("gives a single code example no orphaned tab relationship",()=>{
  const {container,unmount}=render(<CodeBlock code="fallback" examples={[{label:"Plain",language:"text",code:"one"}]}/>);
  try {expect(container.querySelector('[role="tab"]')).toBeNull();expect(container.querySelector('[role="tabpanel"]')).toBeNull();expect(container.querySelector('[aria-labelledby]')).toBeNull();expect(container.querySelector("pre")?.textContent).toBe("one");}finally{unmount();}
 });
});
