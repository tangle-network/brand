import { createServer } from "vite";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
const out = resolve(process.env.DESIGN_EVIDENCE ?? "/tmp/brand-design-evidence");
await mkdir(out, {recursive:true});
const server = await createServer({configFile:false, server:{host:"127.0.0.1",port:0},plugins:[{name:"design-fixture",configureServer(s){s.middlewares.use("/design-contract",(_req,res)=>{res.setHeader("Content-Type","text/html");res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tangle design contract</title></head><body><div id="root"></div><script type="module" src="/scripts/fixtures/design-contract.tsx"></script></body></html>');});}}]});
await server.listen();
const url = server.resolvedUrls.local[0]+"design-contract";
const browser = await chromium.launch({headless:true});
const cases=[];
try {
 for (const width of [390,1440]) for (const theme of ["light","dark"]) for (const renderer of ["react","hono"]) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
  const page=await context.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(`${url}?renderer=${renderer}&theme=${theme}`);
  await page.locator("h1").waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`${out}/${renderer}-${width}-${theme}.png`,fullPage:true});
  const facts=await page.locator("h1").evaluate(e=>{const s=getComputedStyle(e);return {font:s.fontFamily,size:s.fontSize,color:s.color,overflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelectorAll("h1").length};});
  if(errors.length || facts.overflow || facts.h1!==1) throw Error(JSON.stringify({errors,facts}));
  cases.push({width,theme,renderer,...facts});await context.close();
 }
 const receipt={sha:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),at:new Date().toISOString(),url,cases};
 await writeFile(`${out}/receipt.json`,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
} finally {await browser.close();await server.close();}
