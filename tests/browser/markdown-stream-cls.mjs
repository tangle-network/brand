import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
const out=process.env.CLS_ARTIFACTS??'/tmp/markdown-stream-cls'
await mkdir(out,{recursive:true})
const server=spawn('python3',['-m','http.server','6102','--directory','storybook-static'],{stdio:'ignore'})
const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
const results=[]
try {
 for(const width of [1280,390]) for(const theme of ['dark','light']) {
  const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:out}})
  const page=await context.newPage()
  await page.goto(`http://127.0.0.1:6102/iframe.html?id=markdown-markdown--streaming-blockquote&globals=theme:${theme}`)
  await page.waitForSelector('[data-stream-length="0"]',{state:'attached'});await page.evaluate(()=>document.fonts.ready)
  await page.evaluate(()=>{
   window.shifts=[];window.started=0
   const fixture=document.querySelector('[data-stream-length]')
   new MutationObserver(()=>{if(Number(fixture.dataset.streamLength)>0)window.started ||= performance.now()}).observe(fixture,{attributes:true,attributeFilter:['data-stream-length']})
   new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput&&window.started&&e.startTime>=window.started)window.shifts.push({value:e.value,at:e.startTime})}).observe({type:'layout-shift'})
  })
  await page.waitForSelector('[data-stream-complete="true"]',{timeout:15000});await page.waitForTimeout(200)
  const data=await page.evaluate(()=>({shifts:window.shifts,started:window.started,before:getComputedStyle(document.querySelector('blockquote p'),'::before').content,after:getComputedStyle(document.querySelector('blockquote p'),'::after').content,overflow:document.documentElement.scrollWidth>innerWidth}))
  let cls=0,session=0,start=0,last=0
  for(const e of data.shifts){if(e.at-last>1000||e.at-start>5000){session=0;start=e.at}session+=e.value;last=e.at;cls=Math.max(cls,session)}
  results.push({width,theme,cls,...data})
  await page.screenshot({path:`${out}/${width}-${theme}.png`});await context.close()
 }
 await writeFile(`${out}/cls.json`,JSON.stringify(results,null,2))
 console.log(JSON.stringify(results.map(({width,theme,cls,before,after,overflow})=>({width,theme,cls,before,after,overflow}))))
 if(results.some(r=>r.cls!==0||!r.started||r.before!=='none'||r.after!=='none'||r.overflow))process.exitCode=1
}finally{await browser.close();server.kill()}
