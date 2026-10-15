import { designServer } from "./design-contract-server.mjs";
import { chromium } from "playwright";
import { mkdir,writeFile } from "node:fs/promises";
import { resolve,basename } from "node:path";
import { execFileSync } from "node:child_process";
const out=resolve(process.env.DESIGN_EVIDENCE??"/tmp/brand-retarget-evidence");await mkdir(out,{recursive:true});
const {server,url}=await designServer(),browser=await chromium.launch({headless:true}),cases=[];
try {
 for(const width of [390,1440])for(const kind of ["dialog","sheet"]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"no-preference",recordVideo:{dir:`${out}/videos`}});
  try {
   const page=await context.newPage();await page.goto(`${url}?surface=motion&theme=light`,{waitUntil:"networkidle"});await page.getByRole("button",{name:`Open ${kind}`,exact:true}).waitFor();
   const trace=await page.evaluate(async(kind)=>{
    const root=document.documentElement,probe=document.createElement("i");root.append(probe);probe.style.animation="noop var(--motion-surface)";
    const scopedSeconds=parseFloat(getComputedStyle(probe).animationDuration);probe.remove();
    // Slow both directions equally for consecutive-frame velocity calibration.
    // Derive the fixture profile from the served role; never replace product timing.
    const seconds=scopedSeconds*16;
    root.style.setProperty("--motion-surface",`${seconds}s var(--ease-entrance)`);root.style.setProperty("--motion-dismiss",`${seconds}s var(--ease-exit)`);
    const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
    const intent=window.motionFixture[kind];intent(true);await frame();
    const node=document.querySelector('[role="dialog"]');if(!node)throw Error("Surface failed to mount");
    const hidden=kind==="sheet"?node.getBoundingClientRect().width:0.98,target=kind==="sheet"?0:1;
    const read=()=>{const s=getComputedStyle(node),m=new DOMMatrixReadOnly(s.transform==="none"?undefined:s.transform);const value=kind==="sheet"?m.m41:m.a;return {at:performance.now(),value,progress:(value-hidden)/(target-hidden),opacity:Number(s.opacity),connected:node.isConnected};};
    const samples=[];let previous=read(),current=previous;
    const deadline=performance.now()+seconds*1000;
    while(performance.now()<deadline){await frame();current=read();samples.push(current);if(current.progress>=0.35&&current.progress<=0.7)break;previous=current;}
    if(current.progress<0.35||current.progress>0.7)throw Error("No calibrated halfway sample");
    const before=read();intent(false);const after=read();
    if(Math.abs(after.progress-before.progress)>0.002||Math.abs(after.opacity-before.opacity)>0.002)throw Error(`Close jumped: ${JSON.stringify({before,after})}`);
    const closing=[];
    for(let i=0;i<3;i++){await frame();closing.push(read());}
    const first=closing.find(s=>s.at-before.at>=12&&s.at-before.at<=45&&Math.abs(s.progress-before.progress)>0.0001);
    if(!first)throw Error(`Uncalibrated reversal frame gaps: ${JSON.stringify({before,closing})}`);
    if(first.progress<=before.progress)throw Error(`Velocity restarted on Close: ${JSON.stringify({previous,before,first})}`);
    let retreat=closing.at(-1);const closeDeadline=performance.now()+seconds*500;
    while(performance.now()<closeDeadline){await frame();const next=read();samples.push(next);if(next.progress<before.progress-0.1&&next.progress<retreat.progress-0.002){previous=retreat;retreat=next;break;}retreat=next;}
    const reopenBefore=read();intent(true);const reopenAfter=read();
    if(!node.isConnected||node!==document.querySelector('[role="dialog"]')||Math.abs(reopenAfter.progress-reopenBefore.progress)>0.002)throw Error(`Reopen replaced or jumped: ${JSON.stringify({reopenBefore,reopenAfter})}`);
    const reopening=[];for(let i=0;i<3;i++){await frame();reopening.push(read());}
    const reverse=reopening.find(s=>s.at-reopenBefore.at>=12&&s.at-reopenBefore.at<=45&&Math.abs(s.progress-reopenBefore.progress)>0.0001);
    if(!reverse||reverse.progress>=reopenBefore.progress)throw Error(`Velocity restarted on reopen: ${JSON.stringify({reopenBefore,reopening})}`);
    const end=performance.now()+seconds*2000;let final=read();while(performance.now()<end&&Math.abs(final.progress-1)>0.001){await frame();final=read();}
    if(Math.abs(final.progress-1)>0.001||!node.contains(document.activeElement))throw Error(`Surface failed to settle/focus: ${JSON.stringify(final)}`);
    const bounds=node.getBoundingClientRect();if(kind==="dialog"&&(bounds.left< -1||bounds.right>innerWidth+1))throw Error("Anchored dialog crossed viewport");
    return {scopedSeconds,calibrationMultiplier:16,previous,before,after,closing,reopenBefore,reopenAfter,reopening,final,bounds:{left:bounds.left,right:bounds.right},samples};
   },kind);
   await page.screenshot({path:`${out}/${kind}-${width}.png`});await page.emulateMedia({reducedMotion:"reduce"});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await page.keyboard.press("Escape");await page.getByRole("dialog").waitFor({state:"hidden"});
   const trigger=page.getByRole("button",{name:`Open ${kind}`,exact:true});if(!await trigger.evaluate(e=>e===document.activeElement))throw Error("Reduced dismissal failed focus return");
   cases.push({width,kind,...trace,video:`videos/${basename(await page.video().path())}`});
  }finally{await context.close();}
 }
 await writeFile(`${out}/receipt.json`,JSON.stringify({sha:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),at:new Date().toISOString(),cases},null,2));console.log(JSON.stringify(cases));
}finally{await browser.close();await server.close();}
