import { designServer } from "./design-contract-server.mjs";
import { chromium } from "playwright";
import { mkdir,writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
const out=resolve(process.env.DESIGN_EVIDENCE??"/tmp/brand-layout-evidence");await mkdir(out,{recursive:true});
const {server,url}=await designServer();const browser=await chromium.launch({headless:true});const cases=[];
try {
 for(const width of [390,1440])for(const theme of ["light","dark"])for(const renderer of ["react","hono"]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:"reduce",recordVideo:{dir:`${out}/videos`,size:{width,height:1000}}});
  const page=await context.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
  for(const phase of renderer==="react"?["before","after"]:["after"]){
   await page.goto(`${url}?surface=layout&phase=${phase}&renderer=${renderer}&theme=${theme}`);await page.getByRole("heading",{name:"API keys",exact:true}).waitFor();
   await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${out}/${phase}-${renderer}-${width}-${theme}.png`,fullPage:true});
   if(phase==="before")continue;
   const trigger=page.getByRole("button",{name:"Sections",exact:true});await trigger.focus();await page.keyboard.press("Enter");
   const dialog=page.getByRole("dialog");await dialog.waitFor();
   for(let i=0;i<9;i++){await page.keyboard.press("Tab");if(!await page.evaluate(()=>document.querySelector("dialog").contains(document.activeElement)))throw Error("Focus escaped dialog");}
   await page.keyboard.press("Escape");await dialog.waitFor({state:"hidden"});if(!await trigger.evaluate(e=>e===document.activeElement))throw Error("Focus not returned");
   await trigger.click();await page.getByRole("button",{name:"Close navigation",exact:true}).click();await dialog.waitFor({state:"hidden"});
   await page.getByRole("textbox",{name:"Workspace name"}).fill("Example workspace");
   const facts=await page.evaluate(()=>{const h=document.querySelector("h1"),input=document.querySelector("input"),s=getComputedStyle(h);return {font:s.fontFamily,size:s.fontSize,inputHeight:input.getBoundingClientRect().height,inputFont:getComputedStyle(input).fontSize,h1:document.querySelectorAll("h1").length,overflow:document.documentElement.scrollWidth>innerWidth,fields:document.querySelectorAll("input").length};});
   if(errors.length||facts.overflow||facts.h1!==1||facts.inputHeight!==44)throw Error(JSON.stringify({errors,facts}));cases.push({width,theme,renderer,...facts});
  }await context.close();
 }
 for(const width of [390,1440])for(const theme of ["light","dark"]){const [a,b]=cases.filter(c=>c.width===width&&c.theme===theme);if(a.font!==b.font||a.size!==b.size||a.inputHeight!==b.inputHeight)throw Error("Renderer role mismatch");}
 await writeFile(`${out}/receipt.json`,JSON.stringify({sha:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),at:new Date().toISOString(),cases},null,2));console.log(JSON.stringify(cases));
}finally{await browser.close();await server.close();}
