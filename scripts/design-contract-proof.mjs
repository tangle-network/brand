import { designServer } from "./design-contract-server.mjs";
import { proveKnotPackage } from "./design-package-proof.mjs";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
const out = resolve(process.env.DESIGN_EVIDENCE ?? "/tmp/brand-design-evidence");
await mkdir(out, {recursive:true});
if(process.argv.includes("--registry") || process.argv.includes("--published")) {
 const packages=[];
 for(const name of ["brand","ui"]) {
  const response=await fetch(`https://registry.npmjs.org/@tangle-network/${name}/latest`);
  if(!response.ok)throw Error(`Registry ${name}: ${response.status}`);
  const manifest=await response.json();
  const expected=name==="brand"?["./knot"]:["./presentation","./code-presentation"];
  packages.push({name:manifest.name,version:manifest.version,integrity:manifest.dist.integrity,contracts:expected.map(path=>({path,published:Boolean(manifest.exports?.[path])}))});
 }
 const published=packages.flatMap(p=>p.contracts).filter(c=>c.published).length;
 const receipt={at:new Date().toISOString(),source:"npm registry latest manifests",published,target:3,packages};
 await writeFile(`${out}/registry.json`,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
 if(process.argv.includes("--published")&&published!==3)throw Error("Requested contracts are not all published");
 process.exit(0);
}
await proveKnotPackage(out);
const {server,url} = await designServer();
const browser = await chromium.launch({headless:true});
const cases=[];
try {
 for (const width of [390,1440]) for (const theme of ["light","dark"]) for (const renderer of ["react","hono"]) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
  const page=await context.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(`${url}?renderer=${renderer}&theme=${theme}`,{waitUntil:"networkidle"});
  await page.locator("h1").waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.locator(".tangle-control-display").first().waitFor();
  const roles=await page.evaluate(()=>{
   const h=document.querySelector("h1"),b=document.querySelector(".tangle-control-display"),d=document.querySelector(".tangle-intro-description");
   const hs=getComputedStyle(h),bs=getComputedStyle(b),ds=getComputedStyle(d);
   const rgb=c=>{const x=document.createElement("canvas").getContext("2d");x.fillStyle=c;x.fillRect(0,0,1,1);return [...x.getImageData(0,0,1,1).data].slice(0,3);};
   const luminance=c=>rgb(c).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
   const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
   return {titleSize:hs.fontSize,titleFont:hs.fontFamily,bodyFont:ds.fontFamily,ctaHeight:b.getBoundingClientRect().height,ctaRadius:bs.borderRadius,ctaContrast:ratio(bs.color,bs.backgroundColor),bodyContrast:ratio(ds.color,getComputedStyle(document.querySelector("header")).backgroundColor),fonts:document.fonts.check('700 40px Outfit')&&document.fonts.check('400 16px Geist'),motion:document.getAnimations().length,knotPaths:[...document.querySelectorAll("svg path")].map(e=>e.getAttribute("d"))};
  });
  if(roles.ctaHeight!==46 || roles.ctaRadius!=="10px" || Math.min(roles.ctaContrast,roles.bodyContrast)<4.5 || !roles.fonts || roles.motion!==0)throw Error(JSON.stringify(roles));
  await page.screenshot({path:`${out}/${renderer}-${width}-${theme}.png`,fullPage:true});
  const facts=await page.locator("h1").evaluate(e=>{const s=getComputedStyle(e);return {font:s.fontFamily,size:s.fontSize,color:s.color,overflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelectorAll("h1").length};});
  if(errors.length || facts.overflow || facts.h1!==1) throw Error(JSON.stringify({errors,facts}));
  cases.push({width,theme,renderer,...facts,roles});await context.close();
 }
 for(const width of [390,1440])for(const theme of ["light","dark"]){
  const pair=cases.filter(c=>c.width===width&&c.theme===theme);if(JSON.stringify(pair[0].roles)!==JSON.stringify(pair[1].roles))throw Error("Renderer role mismatch");
 }
 const receipt={sha:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),at:new Date().toISOString(),url,cases};
 await writeFile(`${out}/receipt.json`,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
} finally {await browser.close();await server.close();}
