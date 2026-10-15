import { designServer } from "./design-contract-server.mjs";
import { chromium } from "playwright";
import { mkdir,writeFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { execFileSync } from "node:child_process";
const out=resolve(process.env.DESIGN_EVIDENCE??"/tmp/brand-layout-evidence");await mkdir(out,{recursive:true});
const {server,url}=await designServer();const browser=await chromium.launch({headless:true});const cases=[];
// Focused review regressions also retain failure receipts for red/green comparison.
if(process.argv.includes("--review-only")){
 const reviewCases=[];
 try {
  for(const renderer of ["react","hono"]){
   const context=await browser.newContext({viewport:{width:1024,height:900},reducedMotion:"reduce",recordVideo:{dir:`${out}/videos`}});
   try{
    const page=await context.newPage();
    for(const width of [1024,1279,1280,1440]){
     await page.setViewportSize({width,height:900});await page.goto(`${url}?surface=layout&renderer=${renderer}&theme=light`,{waitUntil:"networkidle"});await page.locator(".tangle-reading-outline").waitFor({state:"attached"});
     const facts=await page.evaluate(()=>{const outline=document.querySelector(".tangle-reading-outline"),article=document.querySelector(".tangle-reading-article");return {display:getComputedStyle(outline).display,left:outline.getBoundingClientRect().left,top:outline.getBoundingClientRect().top,articleRight:article.getBoundingClientRect().right,articleTop:article.getBoundingClientRect().top};});
     const pass=width<1280?facts.display==="none":facts.display!=="none"&&facts.left>=facts.articleRight&&Math.abs(facts.top-facts.articleTop)<1;
     reviewCases.push({check:"outline",renderer,width,pass,...facts});await page.screenshot({path:`${out}/outline-${renderer}-${width}.png`});
    }
    for(const selected of [0,1,-1]){
     const trigger=page.getByRole("button",{name:"Sections",exact:true});await trigger.click();const dialog=page.getByRole("dialog");await dialog.waitFor();
     await dialog.evaluate((d,selected)=>{d.innerHTML='<button id="boundary-start">Start</button>'+[0,1,2].map(i=>`<label>Choice${i}<input type="radio" name="boundary" id="choice-${i}" ${i===selected?"checked":""}></label>`).join("");document.getElementById("boundary-start").focus();},selected);
     const trace=[];
     for(const direction of ["Tab","Shift+Tab"]){
      // Enter then cross the radio group boundary twice in each direction.
      await page.locator("#boundary-start").focus();
      for(let i=0;i<4;i++){await page.keyboard.press(direction);trace.push(await page.evaluate(()=>({direction:window.reviewDirection,id:document.activeElement.id,inside:document.querySelector("dialog").contains(document.activeElement)})));trace.at(-1).direction=direction;}
     }
     const forwardRadio=`choice-${selected<0?0:selected}`,reverseRadio=`choice-${selected<0?2:selected}`;
     const expected=[forwardRadio,"boundary-start",forwardRadio,"boundary-start",reverseRadio,"boundary-start",reverseRadio,"boundary-start"];
     const pass=trace.every((point,i)=>point.inside&&point.id===expected[i]);
     reviewCases.push({check:"radio",renderer,selected,pass,expected,trace});await page.keyboard.press("Escape");await dialog.waitFor({state:"hidden"});
    }
    const video=`videos/${basename(await page.video().path())}`;for(const c of reviewCases.filter(c=>c.renderer===renderer))c.video=video;
   }finally{await context.close();}
  }
 }finally{await browser.close();await server.close();}
 const receipt={sha:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),at:new Date().toISOString(),cases:reviewCases};
 await writeFile(`${out}/review-receipt.json`,JSON.stringify(receipt,(_key,value)=>typeof value==="number"?Number(value.toFixed(6)):value,2));
 console.log(JSON.stringify(reviewCases));process.exit(reviewCases.every(c=>c.pass)?0:1);
}
try {
 for(const width of [390,1440])for(const theme of ["light","dark"])for(const renderer of ["react","hono"]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:"reduce",recordVideo:{dir:`${out}/videos`,size:{width,height:1000}}});
  try {
  const page=await context.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
  for(const phase of renderer==="react"?["before","after"]:["after"]){
   await page.goto(`${url}?surface=layout&phase=${phase}&renderer=${renderer}&theme=${theme}`,{waitUntil:"networkidle"});await page.getByRole("heading",{name:"API keys",exact:true}).waitFor();
   await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${out}/${phase}-${renderer}-${width}-${theme}.png`,fullPage:true});
   if(phase==="before")continue;
   const trigger=page.getByRole("button",{name:"Sections",exact:true});await trigger.focus();await page.keyboard.press("Enter");
   const dialog=page.getByRole("dialog");await dialog.waitFor();
   await dialog.evaluate(d=>{const hidden=document.createElement("button"),disabled=document.createElement("button");hidden.hidden=true;hidden.textContent="Hidden decoy";disabled.disabled=true;disabled.tabIndex=1;disabled.textContent="Disabled decoy";d.append(hidden,disabled);});
   const backdrop=await dialog.evaluate(e=>{const s=getComputedStyle(e,"::backdrop");return {animation:s.animationName,duration:s.transitionDuration};});
   if(backdrop.animation!=="none"||backdrop.duration.split(", ").some(d=>d!=="0s"))throw Error(`Reduced native backdrop moves: ${JSON.stringify(backdrop)}`);
   const cycle=["Quickstart","Authentication","Errors","Close navigation"];let index=0;
   if(await page.evaluate(()=>document.activeElement.textContent)!==cycle[0])throw Error("Wrong initial dialog focus");
   for(const direction of ["Tab","Shift+Tab"])for(let i=0;i<9;i++) {
    await page.keyboard.press(direction);
    const focus=await page.evaluate(()=>{const d=document.querySelector("dialog"),a=document.activeElement;return {inside:d.contains(a),open:d.open,tag:a?.tagName,id:a?.id,label:a?.getAttribute("aria-label"),text:a?.textContent};});
    index=(index+(direction==="Tab"?1:cycle.length-1))%cycle.length;
    if(!focus.inside||focus.text!==cycle[index]){await page.screenshot({path:`${out}/failed-focus-${renderer}-${width}-${theme}.png`});throw Error(JSON.stringify({message:"Focus escaped dialog",width,theme,renderer,direction,tab:i+1,focus}));}
   }
   await page.keyboard.press("Escape");await dialog.waitFor({state:"hidden"});if(!await trigger.evaluate(e=>e===document.activeElement))throw Error("Focus not returned");
   await trigger.click();await page.getByRole("button",{name:"Close navigation",exact:true}).click();await dialog.waitFor({state:"hidden"});
   await page.getByRole("textbox",{name:"Workspace name"}).fill("Example workspace");
   const compatibilityHeight=await page.getByRole("button",{name:"Compatibility action"}).evaluate(e=>e.getBoundingClientRect().height);
   if(compatibilityHeight!==36)throw Error(`Compatibility recipe height: ${compatibilityHeight}`);
   const facts=await page.evaluate(()=>{const h=document.querySelector("h1"),input=document.querySelector("input"),s=getComputedStyle(h);return {font:s.fontFamily,size:s.fontSize,inputHeight:input.getBoundingClientRect().height,inputFont:getComputedStyle(input).fontSize,h1:document.querySelectorAll("h1").length,overflow:document.documentElement.scrollWidth>innerWidth,fields:document.querySelectorAll("input").length};});
   if(errors.length||facts.overflow||facts.h1!==1||facts.inputHeight!==44)throw Error(JSON.stringify({errors,facts}));cases.push({width,theme,renderer,...facts,backdrop,video:`videos/${basename(await page.video().path())}`});
  }}finally{await context.close();}
 }
 for(const width of [390,1440])for(const theme of ["light","dark"]){const [a,b]=cases.filter(c=>c.width===width&&c.theme===theme);if(a.font!==b.font||a.size!==b.size||a.inputHeight!==b.inputHeight)throw Error("Renderer role mismatch");}
 await writeFile(`${out}/receipt.json`,JSON.stringify({sha:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),at:new Date().toISOString(),cases},(_key,value)=>typeof value==="number"?Number(value.toFixed(6)):value,2));console.log(JSON.stringify(cases));
}finally{await browser.close();await server.close();}
