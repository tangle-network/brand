import { describe, it, expect } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { knot, knotSvg } from "./knot";
import { TangleKnot } from "./logo";
describe("canonical knot across renderers",()=>{
 it("uses identical geometry and distinct gradient ids",()=>{
  const react=renderToStaticMarkup(<><TangleKnot/><TangleKnot label=""/></>);
  for(const path of knot.paths)expect(react).toContain(path.d);
  const ids=[...react.matchAll(/linearGradient id="([^"]+)"/g)].map(m=>m[1]);
  expect(new Set(ids).size).toBe(4);
  const svg=knotSvg({id:"hono-1"});for(const path of knot.paths)expect(svg).toContain(path.d);
  expect(svg).toContain('aria-hidden="true"');expect(react).toContain('aria-hidden="true"');
 });
 it("escapes names and rejects unsafe instance ids",()=>{
  expect(knotSvg({id:"a",label:'<img onerror="bad">'})).toContain('&lt;img onerror=&quot;bad&quot;&gt;');
  expect(()=>knotSvg({id:'a" onload="bad'})).toThrow();
  expect(()=>knotSvg({id:"a",size:NaN})).toThrow();
 });
});
