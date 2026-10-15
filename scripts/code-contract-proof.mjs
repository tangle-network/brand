import { designServer } from "./design-contract-server.mjs";
import { chromium } from "playwright";
import { mkdir,writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
const out=resolve(process.env.DESIGN_EVIDENCE??"/tmp/brand-code-evidence");await mkdir(out,{recursive:true});
const {server,url}=await designServer();const browser=await chromium.launch({headless:true});const cases=[];
try{
 for(const width of [390,1440])for(const theme of ["light","dark"])for(const renderer of ["react","hono"]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:"reduce",permissions:["clipboard-read","clipboard-write"],recordVideo:{dir:`${out}/videos`,size:{width,height:1000}}});
  const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
  for(const phase of renderer==="react"?["before","after"]:["after"]){
   await page.goto(`${url}?surface=code&phase=${phase}&renderer=${renderer}&theme=${theme}`,{waitUntil:"networkidle"});await page.getByRole("heading",{name:"API presentation fixture"}).waitFor();
   await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${out}/${phase}-${renderer}-${width}-${theme}.png`,fullPage:true});if(phase==="before")continue;
   const tabs=page.getByRole("tab");await tabs.first().focus();await page.keyboard.press("ArrowRight");if(await tabs.nth(1).getAttribute("aria-selected")!=="true")throw Error("Tab selection failed");
   const expected=await page.evaluate(()=>window.fixtureExamples[1].code);
   await page.getByRole("tabpanel").getByRole("button",{name:"Copy to clipboard"}).click();
   if(await page.evaluate(()=>navigator.clipboard.readText())!==expected)throw Error("Copy changed bytes");
   await page.getByRole("status").filter({hasText:"Copied to clipboard"}).first().waitFor();
   await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async()=>{throw Error("denied")}}}));
   await page.getByRole("tabpanel").getByRole("button").click();await page.getByRole("status").filter({hasText:"Copy failed"}).first().waitFor();
   await tabs.nth(1).focus();await page.keyboard.press("End");if(await tabs.last().getAttribute("aria-selected")!=="true")throw Error("End navigation failed");await page.keyboard.press("Home");
   const long=page.getByRole("region",{name:"Long JSON line code"});await long.focus();await page.keyboard.press("End");
   const contained=await long.evaluate(e=>e.scrollWidth>e.clientWidth&&e.clientWidth<=innerWidth);
   const facts=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,schema:document.querySelector('.tangle-api-schema').textContent,regions:document.querySelectorAll('[role="region"]').length}));
   if(errors.length||facts.overflow||!contained||!facts.schema.includes("messages.content"))throw Error(JSON.stringify({errors,contained,facts}));cases.push({width,theme,renderer,...facts,exactCopy:true,copyFailure:true,contained});
  }await context.close();
 }
 await writeFile(`${out}/receipt.json`,JSON.stringify({sha:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),at:new Date().toISOString(),cases},null,2));console.log(JSON.stringify(cases));
}finally{await browser.close();await server.close();}
