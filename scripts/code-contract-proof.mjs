import { designServer } from "./design-contract-server.mjs";
import { chromium } from "playwright";
import { mkdir,writeFile } from "node:fs/promises";
import { resolve,basename } from "node:path";
import { execFileSync } from "node:child_process";
const out=resolve(process.env.DESIGN_EVIDENCE??"/tmp/brand-code-evidence");await mkdir(out,{recursive:true});
const {server,url}=await designServer();const browser=await chromium.launch({headless:true});const cases=[];
try{
 for(const width of [390,1440])for(const theme of ["light","dark"])for(const renderer of ["react","hono"])for(const reducedMotion of ["no-preference","reduce"]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion,permissions:["clipboard-read","clipboard-write"],recordVideo:{dir:`${out}/videos`,size:{width,height:1000}}});
  try {
  const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
  for(const phase of renderer==="react"?["before","after"]:["after"]){
   await page.goto(`${url}?surface=code&phase=${phase}&renderer=${renderer}&theme=${theme}`,{waitUntil:"networkidle"});await page.getByRole("heading",{name:"API presentation fixture"}).waitFor();
   await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${out}/${phase}-${renderer}-${width}-${theme}-${reducedMotion}.png`,fullPage:true});if(phase==="before")continue;
   const tabs=page.getByRole("tab");await tabs.first().focus();await page.keyboard.press("ArrowRight");if(await tabs.nth(1).getAttribute("aria-selected")!=="true")throw Error("Tab selection failed");
   const expected=await page.evaluate(()=>window.fixtureExamples[1].code);
   await page.getByRole("button",{name:"Copy to clipboard"}).first().click();
   if(await page.evaluate(()=>navigator.clipboard.readText())!==expected)throw Error("Copy changed bytes");
   await page.getByRole("status").filter({hasText:"Copied to clipboard"}).first().waitFor();
   for(const [label,key] of [["SSE response","sse"],["Binary response","binary"],["Error response","error"],["Long JSON line","long"]]){
    const block=page.getByRole("region",{name:`${label} code`}).locator("..");
    await block.getByRole("button",{name:"Copy to clipboard",exact:true}).click();
    const bytes=await page.evaluate(key=>window.fixtureCodes[key],key);
    if(await page.evaluate(()=>navigator.clipboard.readText())!==bytes)throw Error(`Copy changed ${key} bytes`);
   }
   await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async()=>{throw Error("denied")}}}));
   await page.getByRole("button",{name:/^(Copy to clipboard|Copied)$/}).first().click();await page.getByRole("status").filter({hasText:"Copy failed"}).first().waitFor();
   const failedButton=page.getByRole("button",{name:"Copy to clipboard",exact:true}).first();
   if(!await failedButton.evaluate(e=>e===document.activeElement))throw Error("Copy failure moved focus");
   await page.evaluate(()=>{
    window.fixtureWrites=[];
    Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:text=>new Promise(resolve=>{window.fixtureWrites.push(text);window.fixtureCopySettle=resolve;})}});
   });
   const budgets=await failedButton.evaluate(button=>{
    const probe=document.createElement("i");button.append(probe);const budgets={};
    for(const [key,role] of Object.entries({feedback:"feedback-budget",pending:"pending-delay",longWork:"long-work-delay",mutation:"mutation-budget"})){
     probe.style.animationDuration=`var(--interaction-${role})`;const duration=getComputedStyle(probe).animationDuration;
     const match=/^(\d+(?:\.\d+)?)(ms|s)$/.exec(duration);if(!match)throw Error(`Missing scoped budget ${role}: ${duration}`);
     budgets[key]=Number(match[1])*(match[2]==="s"?1000:1);
    }
    probe.remove();
    // Equivalent scoped seconds and calc(ms) exercise actual computed units.
    button.style.setProperty("--interaction-pending-delay",`${budgets.pending/1000}s`);
    button.style.setProperty("--interaction-long-work-delay",`calc(${budgets.longWork}ms * 1)`);
    const status=button.parentElement.querySelector('[role="status"]');
    const samples=[];let start;window.fixtureCopyTiming={budgets,samples};
    button.addEventListener("click",()=>{start=performance.now();},{capture:true,once:true});
    const observer=new MutationObserver(()=>{if(start!==undefined)samples.push({at:performance.now()-start,busy:button.getAttribute("aria-busy"),loading:button.dataset.copyLoading,long:status.dataset.copyLongWork,status:status.textContent});});
    observer.observe(button,{attributes:true,subtree:true,childList:true});observer.observe(status,{attributes:true,subtree:true,childList:true,characterData:true});
    window.fixtureCopyObserver=observer;
    return budgets;
   });
   await failedButton.click();const pending=page.getByRole("button",{name:"Copying to clipboard",exact:true});
   if(await pending.getAttribute("aria-busy")!=="true"||await pending.getAttribute("aria-disabled")!=="true")throw Error("Pending copy not exposed");
   await page.keyboard.press("Enter");await page.keyboard.press("Space");
   if(await page.evaluate(()=>window.fixtureWrites.length)!==1)throw Error("Overlapping clipboard writes");
   if(!await pending.evaluate(e=>e===document.activeElement))throw Error("Pending copy lost focus");
   await pending.waitFor();
   await page.waitForFunction(()=>window.fixtureCopyTiming.samples.some(s=>s.loading==="true"));
   const longStatus=page.getByRole("status").filter({hasText:"Time remaining unknown"}).first();await longStatus.waitFor();
   const copyTiming=await page.evaluate(()=>window.fixtureCopyTiming);
   const firstPending=copyTiming.samples.find(s=>s.busy==="true"),firstLoading=copyTiming.samples.find(s=>s.loading==="true"),firstLong=copyTiming.samples.find(s=>s.long==="true");
   if(!firstPending||firstPending.at>budgets.feedback||!firstLoading||firstLoading.at<budgets.pending-5||firstLoading.at>budgets.pending+budgets.feedback||!firstLong||firstLong.at<budgets.longWork-5)throw Error(`Copy timing budget failure: ${JSON.stringify(copyTiming)}`);
   const loadingVisible=await pending.evaluate(e=>getComputedStyle(e,"::after").content.includes("…"));
   if(!loadingVisible)throw Error("Contextual loading indicator is not rendered");
   const longVisible=await longStatus.evaluate(e=>getComputedStyle(e).position!=="absolute"&&e.textContent.includes("Cannot cancel")&&/\d+s elapsed/.test(e.textContent));
   if(!longVisible)throw Error("Long write status hidden or missing elapsed/cancellation explanation");
   await page.screenshot({path:`${out}/pending-${renderer}-${width}-${theme}-${reducedMotion}.png`,fullPage:true});
   await page.evaluate(()=>{window.fixtureCopySettle();window.fixtureCopyObserver.disconnect();});await page.getByRole("status").filter({hasText:"Copied to clipboard"}).first().waitFor();
   await tabs.nth(1).focus();await page.keyboard.press("End");if(await tabs.last().getAttribute("aria-selected")!=="true")throw Error("End navigation failed");await page.keyboard.press("Home");
   const long=page.getByRole("region",{name:"Long JSON line code"});await long.focus();await page.keyboard.press("End");
   const contained=await long.evaluate(e=>e.scrollWidth>e.clientWidth&&e.clientWidth<=innerWidth);
   const facts=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,schema:document.querySelector('.tangle-api-schema').textContent,regions:document.querySelectorAll('[role="region"]').length}));
   if(errors.length||facts.overflow||!contained||!facts.schema.includes("messages.content"))throw Error(JSON.stringify({errors,contained,facts}));cases.push({width,theme,renderer,reducedMotion,copyTiming,loadingVisible,longVisible,controlledWriteExceededMutationBudget:firstLong.at>budgets.mutation,...facts,exactCopy:true,exactCopyFormats:["typescript","sse","binary","error","long-json"],copyFailure:true,singlePendingWrite:true,failureFocus:true,contained,video:`videos/${basename(await page.video().path())}`});
  }}finally{await context.close();}
 }
 await writeFile(`${out}/receipt.json`,JSON.stringify({sha:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),at:new Date().toISOString(),cases},(_key,value)=>typeof value==="number"?Number(value.toFixed(6)):value,2));console.log(JSON.stringify(cases));
}finally{await browser.close();await server.close();}
