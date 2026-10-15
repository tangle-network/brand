import { designServer } from "./design-contract-server.mjs";
import { chromium } from "playwright";
import { mkdir,writeFile } from "node:fs/promises";
import { resolve,basename } from "node:path";
import { execFileSync } from "node:child_process";
const out=resolve(process.env.DESIGN_EVIDENCE??"/tmp/brand-code-evidence");await mkdir(out,{recursive:true});
const {server,url}=await designServer();const browser=await chromium.launch({headless:true});const cases=[];
try{
 for(const width of [390,1440])for(const theme of ["light","dark"])for(const renderer of ["react","hono"]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:"reduce",permissions:["clipboard-read","clipboard-write"],recordVideo:{dir:`${out}/videos`,size:{width,height:1000}}});
  try {
  const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
  for(const phase of renderer==="react"?["before","after"]:["after"]){
   await page.goto(`${url}?surface=code&phase=${phase}&renderer=${renderer}&theme=${theme}`,{waitUntil:"networkidle"});await page.getByRole("heading",{name:"API presentation fixture"}).waitFor();
   await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${out}/${phase}-${renderer}-${width}-${theme}.png`,fullPage:true});if(phase==="before")continue;
   const tabs=page.getByRole("tab");await tabs.first().focus();await page.keyboard.press("ArrowRight");if(await tabs.nth(1).getAttribute("aria-selected")!=="true")throw Error("Tab selection failed");
   const expected=await page.evaluate(()=>window.fixtureExamples[1].code);
   await page.getByRole("button",{name:"Copy to clipboard"}).first().click();
   if(await page.evaluate(()=>navigator.clipboard.readText())!==expected)throw Error("Copy changed bytes");
   await page.getByRole("status").filter({hasText:"Copied to clipboard"}).first().waitFor();
   await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async()=>{throw Error("denied")}}}));
   await page.getByRole("button",{name:"Copied",exact:true}).first().click();await page.getByRole("status").filter({hasText:"Copy failed"}).first().waitFor();
   const failedButton=page.getByRole("button",{name:"Copy to clipboard",exact:true}).first();
   if(!await failedButton.evaluate(e=>e===document.activeElement))throw Error("Copy failure moved focus");
   await page.evaluate(()=>{
    window.fixtureWrites=[];
    Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:text=>new Promise(resolve=>{window.fixtureWrites.push(text);window.fixtureCopySettle=resolve;})}});
   });
   await failedButton.click();const pending=page.getByRole("button",{name:"Copying to clipboard",exact:true});
   if(await pending.getAttribute("aria-busy")!=="true"||await pending.getAttribute("aria-disabled")!=="true")throw Error("Pending copy not exposed");
   await page.keyboard.press("Enter");await page.keyboard.press("Space");
   if(await page.evaluate(()=>window.fixtureWrites.length)!==1)throw Error("Overlapping clipboard writes");
   if(!await pending.evaluate(e=>e===document.activeElement))throw Error("Pending copy lost focus");
   await page.evaluate(()=>window.fixtureCopySettle());await page.getByRole("status").filter({hasText:"Copied to clipboard"}).first().waitFor();
   await tabs.nth(1).focus();await page.keyboard.press("End");if(await tabs.last().getAttribute("aria-selected")!=="true")throw Error("End navigation failed");await page.keyboard.press("Home");
   const long=page.getByRole("region",{name:"Long JSON line code"});await long.focus();await page.keyboard.press("End");
   const contained=await long.evaluate(e=>e.scrollWidth>e.clientWidth&&e.clientWidth<=innerWidth);
   const facts=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,schema:document.querySelector('.tangle-api-schema').textContent,regions:document.querySelectorAll('[role="region"]').length}));
   if(errors.length||facts.overflow||!contained||!facts.schema.includes("messages.content"))throw Error(JSON.stringify({errors,contained,facts}));cases.push({width,theme,renderer,...facts,exactCopy:true,copyFailure:true,singlePendingWrite:true,failureFocus:true,contained,video:`videos/${basename(await page.video().path())}`});
  }}finally{await context.close();}
 }
 await writeFile(`${out}/receipt.json`,JSON.stringify({sha:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),at:new Date().toISOString(),cases},null,2));console.log(JSON.stringify(cases));
}finally{await browser.close();await server.close();}
