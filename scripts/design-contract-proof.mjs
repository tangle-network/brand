import { createServer } from "vite";
import { proveKnotPackage } from "./design-package-proof.mjs";
import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
const out = resolve(process.env.DESIGN_EVIDENCE ?? "/tmp/brand-design-evidence");
await mkdir(out, {recursive:true});
await proveKnotPackage(out);
const server = await createServer({configFile:false, optimizeDeps:{include:["react","react-dom/client","react/jsx-runtime","react/jsx-dev-runtime","hono/jsx/jsx-runtime","@radix-ui/react-slot","class-variance-authority","clsx","tailwind-merge"]}, server:{host:"127.0.0.1",port:0},plugins:[{name:"design-fixture",configureServer(s){s.middlewares.use("/__fonts", async(req,res)=>{try{const name=new URL(req.url,"http://fixture").pathname.slice(1);if(!/^[a-z-]+\.woff2$/.test(name))throw Error("font");res.setHeader("Content-Type","font/woff2");res.end(await readFile(resolve(process.env.DESIGN_FONT_DIR ?? "/home/drew/code/tangle-router/public/assets/fonts",name)));}catch{res.statusCode=404;res.end();}});s.middlewares.use("/design-contract",(_req,res)=>{res.setHeader("Content-Type","text/html");res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tangle design contract</title></head><body><div id="root"></div><script type="module" src="/scripts/fixtures/design-contract.tsx"></script></body></html>');});}}]});
await server.listen();
const url = server.resolvedUrls.local[0]+"design-contract";
const browser = await chromium.launch({headless:true});
const cases=[];
try {
 for (const width of [390,1440]) for (const theme of ["light","dark"]) for (const renderer of ["react","hono"]) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
  const page=await context.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(`${url}?renderer=${renderer}&theme=${theme}`,{waitUntil:"networkidle"});
  await page.locator("h1").waitFor().catch(async error=>{await page.screenshot({path:`${out}/failed-${renderer}-${width}-${theme}.png`});throw Error(JSON.stringify({errors,body:await page.locator("body").innerText(),cause:error.message}));});await page.evaluate(()=>document.fonts.ready);
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
