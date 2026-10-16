import { designServer } from "./design-contract-server.mjs";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, basename, dirname } from "node:path";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const out=resolve(process.env.DESIGN_EVIDENCE??"/tmp/brand-tooltip-reopen");await mkdir(out,{recursive:true});
const {server,url}=await designServer(),browser=await chromium.launch({headless:true}),cases=[];
const require=createRequire(resolve("packages/ui/package.json"));
const version=name=>{let dir=dirname(require.resolve(name));while(dir!==dirname(dir)){const file=resolve(dir,"package.json");if(existsSync(file)){const p=JSON.parse(readFileSync(file,"utf8"));if(p.name===name)return p.version;}dir=dirname(dir);}throw Error(`No version identity for ${name}`);};
const cohort={react:version("react"),tooltip:version("@radix-ui/react-tooltip")};
const json=value=>JSON.stringify(value,(_k,v)=>typeof v==="number"?Number(v.toFixed(6)):v,2);
try {
 for(const width of [390,1440])for(const reducedMotion of ["no-preference","reduce"])for(const mode of ["uncontrolled","controlled","default"]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion,recordVideo:{dir:`${out}/videos`}}),page=await context.newPage();let result={width,reducedMotion,mode,pass:false};
  try {
   await page.addInitScript(()=>{
    const ids=new WeakMap();let nextId=0;window.tooltipRows=[];window.tooltipPhase="preparation";
    const snap=()=>{const trigger=document.querySelector('[data-tooltip-trigger="Primary"]'),content=document.querySelector('[data-tooltip-content="Primary"]');if(content&&!ids.has(content))ids.set(content,++nextId);return {focused:document.activeElement===trigger,triggerState:trigger?.dataset.state,description:trigger?.getAttribute("aria-describedby"),contentState:content?.dataset.state,node:content?ids.get(content):null,oldConnected:!!window.oldTooltipNode?.isConnected};};
    window.recordTooltip=(kind,extra={})=>{const row={kind,at:performance.now(),phase:window.tooltipPhase,...extra,...snap()};window.tooltipRows.push(row);if(kind==="focusout"&&row.phase==="reopen"&&extra.primary)window.tooltipFocusoutAt??=row.at;};
    for(const type of ["focusin","focusout","keydown","tooltip.open","animationend","animationcancel"])document.addEventListener(type,event=>{
     const primary=event.target?.matches?.('[data-tooltip-trigger="Primary"]')??false;
     const withheld=!!window.blockTooltipEnds&&["animationend","animationcancel"].includes(type)&&event.target?.matches?.('[data-tooltip-content]');
     window.recordTooltip(type,{primary,key:event.key,isTrusted:event.isTrusted,withheld});if(withheld)event.stopImmediatePropagation();
    },true);
    let last="";new MutationObserver(()=>{const state=JSON.stringify(snap());if(state!==last){last=state;window.recordTooltip("state");}}).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:["data-state","aria-describedby"]});
   });
   await page.goto(`${url}?surface=motion&theme=light&tooltipMode=${mode}`,{waitUntil:"networkidle"});
   const trigger=page.locator('[data-tooltip-trigger="Primary"]'),before=page.locator('[data-tooltip-before="Primary"]');
   await before.focus();await page.keyboard.press("Tab");
   await page.waitForFunction(()=>document.querySelector('[data-tooltip-trigger="Primary"]')?.getAttribute("aria-describedby")&&document.querySelector('[data-tooltip-content="Primary"]')?.dataset.state!=="closed");
   const preparation=await page.evaluate(()=>{
    const node=document.querySelector('[data-tooltip-content="Primary"]'),s=getComputedStyle(node),time=parseFloat(s.animationDuration),seconds=s.animationDuration.endsWith("ms")?time/1000:time;
    window.oldTooltipNode=node;window.tooltipDismissMs=matchMedia("(prefers-reduced-motion: reduce)").matches?0:parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--motion-dismiss"))*1000;
    const probe=document.createElement("i");document.documentElement.append(probe);probe.style.animation="noop var(--motion-dismiss)";const duration=getComputedStyle(probe).animationDuration;probe.remove();window.tooltipDismissMs=parseFloat(duration)*(duration.endsWith("ms")?1:1000);
    const style=document.createElement("style");style.textContent='[data-tooltip-content]{animation-play-state:paused!important}';document.head.append(style);window.blockTooltipEnds=true;window.tooltipPhase="reopen";
    window.recordTooltip("armed",{dismissMs:window.tooltipDismissMs});return {dismissMs:window.tooltipDismissMs,openingSeconds:seconds};
   });
   await page.screenshot({path:`${out}/${mode}-${width}-${reducedMotion}-open.png`});
   // Restore real DOM focus on the browser's published close, avoiding a second
   // host protocol round trip inside the role deadline. Never dispatch events
   // or write Root state; keep native Tab departure and the fresh Tab control.
   await page.evaluate(()=>{
    const observer=new MutationObserver(()=>{
     const trigger=document.querySelector('[data-tooltip-trigger="Primary"]');
     const closed=trigger?.dataset.state==="closed";
     const ready=window.tooltipDismissMs===0?!window.oldTooltipNode.isConnected:window.oldTooltipNode.isConnected&&window.oldTooltipNode.dataset.state==="closed";
     if(window.tooltipFocusoutAt!==undefined&&closed&&ready){
      observer.disconnect();window.recordTooltip("focusreturn",{method:"native DOM focus after published close"});trigger.focus();
     }
    });
    observer.observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:["data-state","aria-describedby"]});
   });
   await page.keyboard.press("Tab");
   await page.waitForFunction(()=>window.tooltipFocusoutAt!==undefined&&performance.now()>=window.tooltipFocusoutAt+window.tooltipDismissMs+120,null,{timeout:1500});
   const trace=await page.evaluate(()=>({rows:window.tooltipRows,focusoutAt:window.tooltipFocusoutAt,dismissMs:window.tooltipDismissMs,finalOpen:document.querySelector('[data-tooltip-trigger="Primary"]')?.dataset.state!=="closed"&&!!document.querySelector('[data-tooltip-content="Primary"]'),finalNodeSame:document.querySelector('[data-tooltip-content="Primary"]')===window.oldTooltipNode,descriptionRestored:!!document.querySelector('[data-tooltip-trigger="Primary"]')?.getAttribute("aria-describedby"),disabled:document.getElementById("disabled-Primary").disabled,disabledActions:window.disabledActions??0}));
   const accepted=trace.rows.filter(r=>r.phase==="reopen"&&r.at>=trace.focusoutAt&&(r.kind==="accepted"&&r.name==="Primary"&&r.open||r.kind==="tooltip.open")&&r.focused);
   const openBeforeDeadline=trace.rows.some(r=>r.phase==="reopen"&&r.at>=trace.focusoutAt&&r.at-trace.focusoutAt<trace.dismissMs&&r.focused&&r.contentState&&r.contentState!=="closed"&&r.oldConnected);
   const trustedFocus=trace.rows.some(r=>r.phase==="reopen"&&r.kind==="focusin"&&r.primary&&r.isTrusted);
   // A controlled Root accepts through onOpenChange before DOM publication.
   // Keep the same role deadline; record acceptance and publication separately.
   const rootAcceptances=accepted.filter(r=>r.kind==="accepted"&&r.name==="Primary"&&r.open);
   const acceptedBeforeDeadline=rootAcceptances.some(r=>r.at-trace.focusoutAt<trace.dismissMs&&r.oldConnected);
   const valid=trustedFocus&&(reducedMotion==="reduce"?accepted.length>0:acceptedBeforeDeadline||openBeforeDeadline&&accepted.length>0);
   result={...result,preparation,valid,acceptance:{rootAt:rootAcceptances[0]?.at,withinDeadline:acceptedBeforeDeadline,domOpenWithinDeadline:openBeforeDeadline},trace,pass:valid&&trace.finalOpen&&trace.descriptionRestored&&trace.disabled&&trace.disabledActions===0&&(reducedMotion==="reduce"?!trace.finalNodeSame:trace.finalNodeSame)};
   if(!valid)result.failure="No accepted before-deadline reopen captured; instrumentation is inconclusive, not a product defect.";
   else if(!result.pass)result.failure="Accepted Tooltip reopen does not survive the old owner deadline.";
   if(result.pass){
    await page.keyboard.press("Enter");
    await page.locator('[data-tooltip-trigger="Sibling"]').hover();
    await page.waitForFunction(()=>{const sibling=document.querySelector('[data-tooltip-content="Sibling"]');return !!sibling&&sibling.dataset.state!=="closed"&&document.querySelector('[data-tooltip-trigger="Primary"]')?.dataset.state==="closed";},null,{timeout:1500});
    result.siblingClose=true;result.pass=await page.evaluate(()=>(window.disabledActions??0)===0);
   }
   await page.screenshot({path:`${out}/${mode}-${width}-${reducedMotion}-final.png`});
  }catch(error){result.failure=String(error);result.pass=false;result.rows=await page.evaluate(()=>window.tooltipRows??[]).catch(()=>[]);}
  finally{result.video=`videos/${basename(await page.video().path())}`;await context.close();cases.push(result);await writeFile(`${out}/partial.json`,json({cases}));}
 }
 const receipt={cohort,sha:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),at:new Date().toISOString(),scope:"Real Tooltip Root/Content and labelled focusable group with disabled native child; Native Tab departure and fresh keyboard control; browser-local native DOM focus restoration after published close. Actual trusted focus and internal CustomEvent distinguished. Earlier native Shift+Tab attempts retained separately. No production or calibrated latency claim.",cases};
 await writeFile(`${out}/receipt.json`,json(receipt));console.log(json({sha:receipt.sha,passed:cases.filter(r=>r.pass).length,failed:cases.filter(r=>!r.pass).length,invalid:cases.filter(r=>r.valid===false).length}));if(cases.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();await server.close();}
