import { designServer } from "./design-contract-server.mjs";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { execFileSync } from "node:child_process";
const out=resolve(process.env.DESIGN_EVIDENCE??"/tmp/brand-motion-evidence");await mkdir(out,{recursive:true});
const {server,url}=await designServer(),browser=await chromium.launch({headless:true}),cases=[];
try {
 for(const reducedMotion of ["no-preference","reduce"]){
  const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion,recordVideo:{dir:`${out}/videos`}});
  try {
   const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
   await page.goto(`${url}?surface=motion&theme=light`,{waitUntil:"networkidle"});await page.getByRole("button",{name:"Control",exact:true}).waitFor();
   const timing=await page.evaluate(()=>{
    const read=(selector)=>{const s=getComputedStyle(document.querySelector(selector));return {transition:s.transition,property:s.transitionProperty,duration:s.transitionDuration,easing:s.transitionTimingFunction,animation:s.animationName,animationDuration:s.animationDuration,animationEasing:s.animationTimingFunction};};
    const probe=document.createElement("i");document.body.append(probe);const role={};
    for(const name of ["control","surface","dismiss","arrive"]){probe.style.transition=`opacity var(--motion-${name})`;const s=getComputedStyle(probe);role[name]={duration:s.transitionDuration,easing:s.transitionTimingFunction};}
    probe.remove();return {role,controls:[read("button"),read("input"),read(".tangle-control-display")],arrival:read(".tangle-intro")};
   });
   for(const control of timing.controls){
    if(reducedMotion==="reduce"){if(control.property!=="none")throw Error(`Reduced control still transitions: ${JSON.stringify(control)}`);}
    else if(control.property==="all"||control.duration.split(", ").some(d=>d!==timing.role.control.duration)||control.easing.split(/, (?=[a-z])/).some(e=>e!==timing.role.control.easing))throw Error(`Invalid role transition: ${JSON.stringify({control,role:timing.role.control})}`);
   }
   if(reducedMotion==="reduce"?timing.arrival.animation!=="none":timing.arrival.animationDuration!==timing.role.arrive.duration||timing.arrival.animationEasing!==timing.role.arrive.easing)throw Error(`Invalid arrival role: ${JSON.stringify(timing)}`);
   for(const kind of ["dialog","sheet"]){
    const trigger=page.getByRole("button",{name:`Open ${kind}`,exact:true});await trigger.focus();await page.keyboard.press("Enter");
    const dialog=page.getByRole("dialog");await dialog.waitFor();
    const opening=await dialog.evaluate(e=>{const s=getComputedStyle(e);return {name:s.animationName,duration:s.animationDuration,easing:s.animationTimingFunction,focus:e.contains(document.activeElement)};});
    if(!opening.focus)throw Error(`${kind} did not own focus`);
    if(reducedMotion==="reduce"?opening.name!=="none":opening.name!=="tangle-surface-present"||opening.duration!==timing.role.surface.duration||opening.easing!==timing.role.surface.easing)throw Error(`Invalid ${kind} opening role: ${JSON.stringify(opening)}`);
    const overlays=await page.evaluate(()=>[...document.querySelectorAll('[data-state="open"]')].map(e=>getComputedStyle(e)).filter(s=>s.position==="fixed"&&[s.top,s.right,s.bottom,s.left].every(v=>v==="0px")).map(s=>({animation:s.animationName,duration:s.animationDuration,easing:s.animationTimingFunction})));
    if(overlays.length!==1)throw Error(`Expected one modal overlay, got ${overlays.length}`);
    if(reducedMotion==="reduce"?overlays[0].animation!=="none":overlays[0].duration!==timing.role.surface.duration)throw Error(`Invalid modal overlay motion: ${JSON.stringify(overlays)}`);
    await page.screenshot({path:`${out}/${kind}-${reducedMotion}.png`});
    await page.keyboard.press("Escape");
    if(reducedMotion!=="reduce"){
     const closing=await dialog.evaluate(e=>{const s=getComputedStyle(e);return {name:s.animationName,duration:s.animationDuration,easing:s.animationTimingFunction};});
     if(closing.name!=="tangle-surface-absent"||closing.duration!==timing.role.dismiss.duration||closing.easing!==timing.role.dismiss.easing)throw Error(`Invalid ${kind} dismissal role: ${JSON.stringify(closing)}`);
    }
    await dialog.waitFor({state:"hidden"});if(!await trigger.evaluate(e=>e===document.activeElement))throw Error(`${kind} failed focus return`);
    // Changing preference while open must not strand focus or dismissal.
    await trigger.click();await dialog.waitFor();await page.emulateMedia({reducedMotion:"reduce"});
    await page.waitForFunction(()=>matchMedia("(prefers-reduced-motion: reduce)").matches);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const live=await dialog.evaluate(e=>({animation:getComputedStyle(e).animationName,state:e.getAttribute("data-state"),reduce:matchMedia("(prefers-reduced-motion: reduce)").matches,focus:e.contains(document.activeElement)}));
    if(live.animation!=="none"||!live.focus)throw Error(`Live reduced-motion failure: ${JSON.stringify(live)}`);
    await page.keyboard.press("Escape");await dialog.waitFor({state:"hidden"});if(!await trigger.evaluate(e=>e===document.activeElement))throw Error("Preference change stranded focus");
    await page.emulateMedia({reducedMotion});
   }
   await page.getByRole("button",{name:"Hint",exact:true}).hover();const hint=page.getByText("Tooltip surface",{exact:true}).first();await hint.waitFor();
   const tooltip=await hint.evaluate(e=>{const s=getComputedStyle(e);return {name:s.animationName,duration:s.animationDuration,easing:s.animationTimingFunction};});
   if(reducedMotion==="reduce"?tooltip.name!=="none":tooltip.name!=="tangle-surface-present"||tooltip.duration!==timing.role.surface.duration||tooltip.easing!==timing.role.surface.easing)throw Error(`Invalid tooltip role: ${JSON.stringify(tooltip)}`);
   if(errors.length)throw Error(JSON.stringify(errors));cases.push({reducedMotion,timing,tooltip,video:`videos/${basename(await page.video().path())}`});
  }finally{await context.close();}
 }
 await writeFile(`${out}/receipt.json`,JSON.stringify({sha:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),at:new Date().toISOString(),cases,interruption:"Not established by timing checks; requires trajectory proof"},null,2));console.log(JSON.stringify(cases));
}finally{await browser.close();await server.close();}
