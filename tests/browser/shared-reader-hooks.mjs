/** Real packed UI consumers: named/default/header SSE and measured ChatContainer growth. */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { build } from 'vite'
import { chromium } from 'playwright'
import { CALL_SHEET } from '../../packages/ui/src/editor/source-markdown.fixtures.ts'

const consumer=process.env.UI_HOOKS_CONSUMER,evidence=process.env.UI_HOOKS_EVIDENCE
assert.ok(consumer,'Use a fresh installed UI package')
const require=createRequire(resolve(consumer,'package.json'))
async function openHost(){
 const scratch=await mkdtemp(resolve(consumer,'.reader-host-')),entry=resolve(scratch,'host.js')
 await writeFile(resolve(scratch,'panels.tsx'),await readFile(new URL('./expandable-panel-fixture.tsx',import.meta.url)))
 await writeFile(resolve(scratch,'command-menu.tsx'),await readFile(new URL('./command-menu-fixture.tsx',import.meta.url)))
 await writeFile(entry,`import{Panels}from'./panels';import{CommandMenuFixture}from'./command-menu';import React,{useMemo,useState}from'react';import{createRoot}from'react-dom/client';import{useSSEStream,useRunNow,useLiveTime}from'@tangle-network/ui/hooks';import{useRunNow as useRootNow}from'@tangle-network/ui';import{useRunNow as leafClock}from'@tangle-network/ui/hooks/use-live-time';import{isOpen as leafIsOpen}from'@tangle-network/ui/run/status-meta';import{ChatContainer}from'@tangle-network/ui/chat';import{RunStatusIcon,runStatus,statusMeta,isOpen}from'@tangle-network/ui/run';import*as chatOwner from'@tangle-network/ui/chat';import*as runOwner from'@tangle-network/ui/run';import*as hooksOwner from'@tangle-network/ui/hooks';import*as timelineLeaf from'@tangle-network/ui/chat/agent-timeline';import*as speakerLeaf from'@tangle-network/ui/chat/speaker';import*as toolLeaf from'@tangle-network/ui/run/expanded-tool-detail';import*as thinkingLeaf from'@tangle-network/ui/run/inline-thinking-item';import*as rowLeaf from'@tangle-network/ui/run/run-row-shell';import*as followLeaf from'@tangle-network/ui/hooks/use-follow-tail';const retainedBindings=[[timelineLeaf,chatOwner],[speakerLeaf,chatOwner],[toolLeaf,runOwner],[thinkingLeaf,runOwner],[rowLeaf,runOwner],[followLeaf,hooksOwner]].every(([leaf,owner])=>Object.entries(leaf).every(([name,value])=>owner[name]===value));import'@tangle-network/sandbox-ui/styles';import{tokenMilliseconds}from'@tangle-network/ui/utils';import{interactionBudgets}from'@tangle-network/ui/code-presentation';window.readTimeToken=tokenMilliseconds;window.readInteractionBudgets=interactionBudgets;
import{DocumentEditorPane}from'@tangle-network/ui/editor';const CALL_SHEET=${JSON.stringify(CALL_SHEET)};function Editor(){const[draft,change]=useState(CALL_SHEET),[saved,save]=useState(CALL_SHEET);return React.createElement(React.Fragment,null,React.createElement(DocumentEditorPane,{title:'Retained call sheet',markdown:draft,savedMarkdown:saved,onChange:change,onSave:save,mode:'edit',backend:'local'}),React.createElement('output',{'data-editor-draft':''},draft),React.createElement('output',{'data-editor-source':''},saved))}
function NestedActions(){const[count,setCount]=useState(0),[route,setRoute]=useState('Transcript');return React.createElement('section',null,React.createElement('button',{onClick:()=>setRoute('All agents')},'All agents'),React.createElement(HoverCard,null,React.createElement(HoverCardTrigger,{asChild:true},React.createElement('div',{'data-tool-row':'',style:{marginTop:12,padding:12,border:'1px solid'}},React.createElement('button',{onClick:()=>setCount(n=>n+1)},'Expand recorded tool'))),React.createElement(HoverCardContent,null,React.createElement('strong',null,'Shell preview'),React.createElement('button',null,'Inspect source'))),React.createElement('output',{'data-action-count':''},count),React.createElement('output',{'data-route':''},route))}
const TYPES=['sample'];function States(){return React.createElement('ul',{'aria-label':'Retained statuses'},['down','cancelled','no-winner','driver-failed','working','winner','recorded','','waiting','needs-you','idle'].map(raw=>{const state=runStatus(raw);return React.createElement('li',{key:raw,'data-record-state':raw,'data-open':isOpen(raw)},React.createElement(RunStatusIcon,{status:state}),statusMeta(state).label)}))}function Notes(){const[showTools,setTools]=useState(false),[answer,setAnswer]=useState(false),[inspected,inspect]=useState('');const messages=[{id:'u',role:'user'},{id:'a',role:'assistant'}],note=text=>({type:'text',text,synthetic:true}),tool=id=>({type:'tool',id,tool:'read',state:{status:'completed',input:{path:'src/'+id+'.ts'},output:'File read.'}}),parts={u:[{type:'text',text:'Question'},note('Request receipt')],a:[...(showTools?[tool('first')]:[]),note('<em>literal</em> **not markdown**'),...(showTools?[tool('second')]:[]),note('Same receipt'),note('Same receipt'),...(answer?[{type:'text',text:'Answer arrived'}]:[])]};const action=(part,context)=>React.createElement('button',{onClick:()=>inspect(JSON.stringify({id:part.id,index:context?.partIndex}))},'Inspect '+part.id);return React.createElement(React.Fragment,null,React.createElement('output',{'data-inspected':''},inspected),React.createElement('button',{onClick:()=>setTools(true)},'Record tools'),React.createElement('button',{onClick:()=>setAnswer(true)},'Deliver answer'),React.createElement('div',{style:{height:600}},React.createElement(ChatContainer,{messages,partMap:parts,isStreaming:!answer,presentation:new URL(location.href).searchParams.get('presentation'),renderToolActions:action,renderTimelineToolActions:part=>action(part)})))}function Host(){const[count,set]=useState(21),[height,grow]=useState(24);const backend=new URL(location.href).searchParams.get('backend')??'native';const stream=useSSEStream({url:'/buffer?backend='+backend,authToken:backend==='headers'?'fixture-local':undefined,eventTypes:backend==='headers'?TYPES:undefined,maxRetries:2,reconnectDelay:20});const messages=useMemo(()=>Array.from({length:count},(_,i)=>({id:'m'+i,role:i%2?'assistant':'user'})),[count]);const parts=useMemo(()=>Object.fromEntries(messages.map((m,i)=>[m.id,[{type:'text',text:'Retained turn '+i+'. '+('Recorded evidence stays readable. '.repeat(8))}]])),[messages]);return React.createElement(React.Fragment,null,React.createElement(States),React.createElement('output',{'data-stream':''},JSON.stringify({state:stream.state,events:stream.events})),React.createElement('button',{onClick:stream.disconnect},'Disconnect'),React.createElement('button',{onClick:stream.connect},'Connect'),React.createElement('button',{onClick:()=>set(n=>n+1)},'Append message'),React.createElement('button',{onClick:()=>grow(n=>n+400)},'Load retained attachment'),React.createElement('div',{id:'chat',style:{height:360,position:'relative'}},React.createElement(ChatContainer,{messages,partMap:parts,isStreaming:false,renderUserMessageActions:m=>m.id==='m20'?React.createElement('aside',{'aria-label':'Retained attachment',style:{height}},'Retained attachment'):null})))}function RunClock({index,fixed}){const useNow=index%2?useRootNow:useRunNow;return React.createElement('output',{'data-clock':index},useNow(fixed))}function Cadence(){return React.createElement('output',{'data-cadence':''},useLiveTime(100))}function Clocks(){const[fixed,fix]=useState(0),[count,set]=useState(16);return React.createElement(React.Fragment,null,React.createElement('output',{'data-binding-identity':''},String(retainedBindings&&useRunNow===useRootNow&&leafClock===useRootNow&&leafIsOpen===isOpen)),React.createElement(States),React.createElement('button',{onClick:()=>fix(undefined)},'Live clock'),React.createElement('button',{onClick:()=>fix(777)},'Recorded timestamp'),React.createElement('button',{onClick:()=>set(n=>n?0:16)},'Mount clocks'),count>0&&React.createElement(Cadence),...Array.from({length:count},(_,index)=>React.createElement(RunClock,{key:index,index,fixed})))}import{HoverCard,HoverCardContent,HoverCardTrigger}from'@tangle-network/ui/primitives/hover-card';import{formatBytes,formatSpanDuration,formatCost,formatCount}from'@tangle-network/ui/utils/format';function Preview(){const[container,mount]=useState(null),[anchor,target]=useState(null),[selected,select]=useState(false),other=React.useRef(null),query=new URL(location.href).searchParams,legacy=query.has('legacy'),measured=query.has('measured'),actual=anchor&&measured?{contextElement:anchor,getBoundingClientRect:()=>anchor.getBoundingClientRect()}:anchor;const trigger=React.createElement('button',{ref:target,onKeyDown:event=>{if(event.key==='x')target(other.current);if(event.key==='Delete')target(null)}},'Preview measurement');return React.createElement('section',{ref:mount,'data-local-theme':'',className:'dark',style:{'--duration-fast':'120ms','--preview-sentinel':'local-theme',height:'70vh',overflow:'hidden',background:'var(--bg-root)',color:'var(--text-primary)'}},React.createElement(HoverCard,{anchor:legacy?undefined:actual},legacy?React.createElement(HoverCardTrigger,{asChild:true},trigger):trigger,React.createElement('button',{ref:other,tabIndex:-1,style:{marginLeft:200}},'Other measurement'),React.createElement(HoverCardContent,{container,style:{maxHeight:'40vh',overflow:'auto'}},query.has('autofocus')&&React.createElement('input',{autoFocus:true,'aria-label':'Retained preview note'}),React.createElement('h2',null,'Retained measurements'),React.createElement('p',null,[formatSpanDuration(7500),formatCost(.0004),formatCount(1200),formatBytes(2048)].join(' / ')),React.createElement('button',{onClick:()=>select(true)},'Inspect retained evidence'),...Array.from({length:30},(_,i)=>React.createElement('p',{key:i},'Recorded source line '+i)))),React.createElement('output',{'data-preview-selection':''},selected?'Original source selected':''))} function SiblingPreviews(){return React.createElement('section',{style:{display:'flex',gap:400,padding:40}},...['A','B'].map(name=>React.createElement(HoverCard,{key:name,defaultOpen:name==='B'},React.createElement(HoverCardTrigger,{asChild:true},React.createElement('button',null,'Preview '+name)),React.createElement(HoverCardContent,{'aria-label':'Preview card '+name},React.createElement('p',null,'Retained '+name)))))} createRoot(document.getElementById('host')).render(React.createElement(new URL(location.href).searchParams.has('command')?CommandMenuFixture:new URL(location.href).searchParams.has('panels')?Panels:new URL(location.href).searchParams.has('siblings')?SiblingPreviews:new URL(location.href).searchParams.has('nested')?NestedActions:new URL(location.href).searchParams.has('hover')?Preview:new URL(location.href).searchParams.has('editor')?Editor:new URL(location.href).searchParams.has('clock')?Clocks:new URL(location.href).searchParams.has('notes')?Notes:Host));`)
 const timeFixture=resolve(scratch,'user-time.js'),hydrate=resolve(scratch,'hydrate.js')
 await writeFile(timeFixture,`import React,{useEffect}from'react';import{UserMessage}from'@tangle-network/ui/chat';export function UserTime(){useEffect(()=>{document.documentElement.dataset.hydrated='true'},[]);return React.createElement(UserMessage,{content:'Retained original message',timestamp:new Date('2026-08-05T17:12:38.000Z')})}`)
 await writeFile(hydrate,`import React from'react';import{hydrateRoot}from'react-dom/client';import{UserTime}from'./user-time.js';hydrateRoot(document.getElementById('host'),React.createElement(UserTime));`)
 const rendered=spawnSync(process.execPath,['--input-type=module','-e',`import React from'react';import{renderToString}from'react-dom/server';import{UserTime}from ${JSON.stringify(timeFixture)};process.stdout.write(renderToString(React.createElement(UserTime)))`],{cwd:consumer,env:{...process.env,TZ:'UTC'},encoding:'utf8'})
 assert.equal(rendered.status,0,rendered.stderr)
 const built=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{write:false,lib:{entry:{host:entry,hydrate},formats:['es'],fileName:(_format,name)=>name+'.js'},rollupOptions:{output:{chunkFileNames:'host/[name]-[hash].js'}}}})
 const chunks=new Map((Array.isArray(built)?built:[built]).flatMap(r=>r.output).map(item=>[item.fileName,item.type==='chunk'?item.code:item.source])),requests=[],clients=new Set()
 const server=createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost')
  if(url.pathname==='/panel-stream'){
   res.writeHead(200,{'content-type':'text/event-stream'});return res.end('event: rows\ndata: '+JSON.stringify({generation:'retained-panel',alive:false,events:[{seq:1,at:new Date(0).toISOString(),event:{kind:'text',text:'Retained conversation.'}}]})+'\n\nevent: end\ndata: {}\n\n')
  }
  if(url.pathname==='/buffer'){
   const prior=requests.filter(r=>r.backend===url.searchParams.get('backend')).length;requests.push({backend:url.searchParams.get('backend'),after:url.searchParams.get('lastEventId'),authorized:req.headers.authorization==='Bearer fixture-local'})
   res.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-cache'});res.flushHeaders();clients.add(res);res.on('close',()=>clients.delete(res))
   res.write(`id: ${prior+1}\n${url.searchParams.get('backend')==='headers'?'event: sample\n':''}data: ${JSON.stringify({value:prior+1})}\n\n`)
   if(url.searchParams.get('backend')==='command'){
    let value=prior+1;const timer=setInterval(()=>res.write(`id: ${++value}\ndata: ${JSON.stringify({value})}\n\n`),200);res.on('close',()=>clearInterval(timer));return
   }
   if(prior===0)res.end();return
  }
  if(url.pathname.startsWith('/assets/')){res.setHeader('content-type',url.pathname.endsWith('.css')?'text/css':'text/javascript');return res.end(chunks.get(url.pathname.slice(8)))}
  const css=[...chunks.keys()].filter(n=>n.endsWith('.css')).map(n=>`<link rel="stylesheet" href="/assets/${n}">`).join('')
  res.end(`<!doctype html><html class="${url.searchParams.get('theme')??'light'}" data-theme="${url.searchParams.get('theme')??'light'}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css}<style>body{margin:0;padding:12px}output{display:block;max-height:100px;overflow:auto;white-space:pre-wrap}button{margin:4px}.panel-fixture:not([data-expanded]){height:calc(100vh - 68px)}.panel-fixture>:not(:first-child){flex:1;min-height:0}</style><div id="host">${url.pathname==='/hydration'?rendered.stdout:''}</div><script type="module" src="/assets/${url.pathname==='/hydration'?'hydrate':'host'}.js"></script></html>`)
 })
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
 return {server,requests,url:`http://127.0.0.1:${server.address().port}`,close:async()=>{for(const response of clients)response.end();await new Promise(resolve=>server.close(resolve));await rm(scratch,{recursive:true,force:true})}}
}

for(const backend of ['native','headers'])test(`buffered SSE keeps existing ${backend} cursor and disconnect contract`,{timeout:60_000},async()=>{
 const host=await openHost(),browser=await chromium.launch({headless:true}),page=await browser.newPage()
 try{
  await page.goto(host.url+'/?backend='+backend)
  await page.waitForFunction(()=>JSON.parse(document.querySelector('[data-stream]').textContent).events.some(event=>event.data.value===2))
  const state=JSON.parse(await page.locator('[data-stream]').textContent());assert.deepEqual(state.events.map(event=>event.data.value),[1,2],'one event per wire frame')
  assert.deepEqual(host.requests.map(req=>req.after),[null,'1']);assert.ok(host.requests.every(req=>req.authorized===(backend==='headers')))
  await page.getByRole('button',{name:'Disconnect',exact:true}).click();await page.waitForTimeout(100);assert.equal(host.requests.length,2)
  await page.getByRole('button',{name:'Connect',exact:true}).click();await page.waitForFunction(()=>JSON.parse(document.querySelector('[data-stream]').textContent).events.some(event=>event.data.value===3));assert.equal(host.requests[2].after,'2')
 }finally{await browser.close();await host.close()}
})

for(const theme of ['light','dark'])for(const width of [1512,390])test(`actual ChatContainer follows measured growth and respects reading ${theme} ${width}`,{timeout:60_000},async()=>{
 const host=await openHost(),browser=await chromium.launch({headless:true});if(evidence)await mkdir(evidence,{recursive:true})
 const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,...(evidence?{recordVideo:{dir:evidence,size:{width,height:900}}}:{})})
 try{
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(host.url+'/?theme='+theme)
  for(const [raw,label,state] of [['down','Failed','failed'],['cancelled','Stopped','stopped'],['no-winner','Stopped','stopped'],['driver-failed','Failed','failed'],['working','Running','running'],['winner','Done','done'],['recorded','Unknown','unknown'],['','Unknown','unknown']]){
   const row=page.locator('[data-record-state='+JSON.stringify(raw)+']');await row.waitFor();assert.equal(await row.innerText(),label);assert.equal(await row.locator('[data-run-status]').getAttribute('data-run-status'),state)
  }
  const pane=page.locator('#chat .overflow-y-auto')
  await page.waitForFunction(()=>{const el=document.querySelector('#chat .overflow-y-auto');return el&&el.scrollTop>100&&el.scrollHeight-el.scrollTop-el.clientHeight<2})
  await page.getByRole('button',{name:'Load retained attachment',exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('[aria-label="Retained attachment"]')?.getBoundingClientRect().height>=424)
  await page.waitForFunction(()=>{const el=document.querySelector('#chat .overflow-y-auto');return el.scrollHeight-el.scrollTop-el.clientHeight<2})
  await pane.hover();await page.mouse.wheel(0,-300);await page.waitForFunction(()=>{const el=document.querySelector('#chat .overflow-y-auto');return el.scrollHeight-el.scrollTop-el.clientHeight>100})
  const before=await pane.evaluate(el=>el.scrollTop);await page.getByRole('button',{name:'Append message',exact:true}).click();await page.getByText('Retained turn 21.',{exact:false}).first().waitFor();await page.waitForTimeout(100)
  assert.ok(Math.abs(await pane.evaluate(el=>el.scrollTop)-before)<=2,'new output cannot move the reader away from the tail')
  await pane.hover();await page.mouse.wheel(0,100000);await page.waitForFunction(()=>{const el=document.querySelector('#chat .overflow-y-auto');return el.scrollHeight-el.scrollTop-el.clientHeight<2})
  await page.getByRole('button',{name:'Load retained attachment',exact:true}).click();await page.waitForFunction(()=>{const el=document.querySelector('#chat .overflow-y-auto');return el.scrollHeight-el.scrollTop-el.clientHeight<2})
  assert.deepEqual(errors,[]);if(evidence)await page.screenshot({path:`${evidence}/chat-${theme}-${width}.png`})
 }finally{await context.close();await browser.close();await host.close()}
})

for(const presentation of ['runs','timeline'])test(`packed ChatContainer preserves notes and tool actions ${presentation}`,{timeout:60_000},async()=>{
 const host=await openHost(),browser=await chromium.launch({headless:true}),page=await browser.newPage()
 try{
  await page.goto(host.url+'/?notes=1&presentation='+presentation)
  const notes=page.getByRole('note',{name:'Application note'});await notes.first().waitFor();assert.equal(await notes.count(),4)
  const literal=page.getByRole('note').filter({hasText:'<em>literal</em> **not markdown**'});assert.equal(await literal.locator('em,strong').count(),0)
  assert.equal(await page.getByRole('note').filter({hasText:'Same receipt'}).count(),2)
  await (presentation==='timeline'?page.getByRole('status',{name:'Agent is thinking'}):page.getByText('Thinking',{exact:true})).waitFor({state:'visible'})
  await page.getByRole('button',{name:'Record tools',exact:true}).click();await page.getByRole('button',{name:'Inspect second',exact:true}).waitFor()
  const order=await page.locator('body').evaluate(el=>{const text=el.innerText;return ['Question','Request receipt','src/first.ts','<em>literal</em>','src/second.ts'].map(value=>text.indexOf(value))});assert.ok(order.every((value,i)=>value>=0&&(i===0||value>order[i-1])))
  await page.getByRole('button',{name:'Inspect second',exact:true}).click();assert.deepEqual(JSON.parse(await page.locator('[data-inspected]').textContent()),presentation==='runs'?{id:'second',index:2}:{id:'second'})
  await page.getByRole('button',{name:'Deliver answer',exact:true}).click();await page.getByText('Answer arrived',{exact:true}).waitFor();assert.equal(await notes.count(),4);assert.equal(await page.getByRole('status',{name:'Agent is thinking'}).count(),0)
 }finally{await browser.close();await host.close()}
})

// The real packed root and hooks entries share state across concurrent readers and replay changes.
test('packed run clocks share one value, preserve replay and resume after unmount', { timeout: 60_000 }, async () => {
 const host=await openHost(),browser=await chromium.launch({headless:true});if(evidence)await mkdir(evidence,{recursive:true})
 const context=await browser.newContext(evidence?{recordVideo:{dir:evidence,size:{width:1280,height:900}}}:{}),page=await context.newPage(),errors=[],began=Date.now()
 page.on('pageerror',error=>errors.push(error.message))
 try{
  await page.goto(host.url+'/?clock=1')
  await page.waitForFunction(()=>document.querySelectorAll('[data-clock]').length===16)
  assert.equal(await page.locator('[data-binding-identity]').innerText(),'true')
  assert.ok((await page.locator('[data-clock]').allTextContents()).every(value=>value==='0'))
  for(const raw of ['down','cancelled','no-winner','driver-failed','winner','recorded','','idle'])assert.equal(await page.locator('[data-record-state='+JSON.stringify(raw)+']').getAttribute('data-open'),'false')
  for(const raw of ['working','waiting','needs-you'])assert.equal(await page.locator('[data-record-state='+JSON.stringify(raw)+']').getAttribute('data-open'),'true')
  await page.getByRole('button',{name:'Live clock',exact:true}).click()
  await page.waitForFunction(()=>{const values=[...document.querySelectorAll('[data-clock]')].map(node=>Number(node.textContent));return values.length===16&&new Set(values).size===1&&values[0]>0})
  const first=Number(await page.locator('[data-clock]').first().innerText())
  await page.waitForFunction(first=>Number(document.querySelector('[data-clock]').textContent)>first,first)
  assert.equal(new Set(await page.locator('[data-clock]').allTextContents()).size,1)
  await page.getByRole('button',{name:'Recorded timestamp',exact:true}).click()
  const cadence=Number(await page.locator('[data-cadence]').innerText());await page.waitForFunction(before=>Number(document.querySelector('[data-cadence]').textContent)>=before+1200,cadence)
  assert.ok((await page.locator('[data-clock]').allTextContents()).every(value=>value==='777'))
  await page.getByRole('button',{name:'Mount clocks',exact:true}).click();assert.equal(await page.locator('[data-clock],[data-cadence]').count(),0)
  await page.getByRole('button',{name:'Live clock',exact:true}).click()
  await page.getByRole('button',{name:'Mount clocks',exact:true}).click()
  await page.waitForFunction(()=>{const values=[...document.querySelectorAll('[data-clock]')].map(node=>Number(node.textContent));return values.length===16&&new Set(values).size===1&&Math.abs(Date.now()-values[0])<1100})
  assert.deepEqual(errors,[])
  if(evidence)await page.screenshot({path:resolve(evidence,'shared-run-clock.png')})
  await page.waitForTimeout(Math.max(0,10100-(Date.now()-began)))
 }finally{await context.close();await browser.close();await host.close()}
})

for(const timezoneId of ['America/Denver','Asia/Tokyo'])test('packed UTC server markup hydrates in '+timezoneId,{timeout:60_000},async()=>{
 const host=await openHost(),browser=await chromium.launch({headless:true});if(evidence)await mkdir(evidence,{recursive:true})
 const context=await browser.newContext({timezoneId,locale:timezoneId==='Asia/Tokyo'?'ja-JP':'en-US',...(evidence?{recordVideo:{dir:evidence,size:{width:1280,height:900}}}:{})}),page=await context.newPage(),errors=[],began=Date.now()
 page.on('pageerror',error=>errors.push(error.message))
 try{
  await page.goto(host.url+'/hydration');await page.waitForFunction(()=>document.documentElement.dataset.hydrated==='true')
  assert.equal(await page.locator('[data-user-message-time]').textContent(),'17:12:38 UTC')
  assert.deepEqual(errors,[])
  if(evidence)await page.screenshot({path:resolve(evidence,'ssr-user-time-'+timezoneId.replace('/','-')+'.png')})
  await page.waitForTimeout(Math.max(0,10100-(Date.now()-began)))
 }finally{await context.close();await browser.close();await host.close()}
})

// Edit through the installed public component, real Tiptap and browser keyboard.
test('packed editor saves the exact source and all table rows after title edit and undo', { timeout: 60_000 }, async () => {
 const host=await openHost(),browser=await chromium.launch({headless:true});if(evidence)await mkdir(evidence,{recursive:true})
 const context=await browser.newContext(evidence?{recordVideo:{dir:evidence,size:{width:1280,height:900}}}:{}),page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 try{
  await page.goto(host.url+'/?editor=1')
  const title=page.locator('.ProseMirror[contenteditable="true"] h1'),saved=page.locator('[data-editor-source]')
  await title.waitFor();assert.equal(await saved.textContent(),CALL_SHEET)
  await title.click();await page.keyboard.press('Home');await page.keyboard.insertText('Draft: ')
  await page.waitForFunction(expected=>document.querySelector('[data-editor-draft]').textContent===expected,CALL_SHEET.replace('# Plausible','# Draft: Plausible'))
  await page.getByRole('button',{name:'Save changes',exact:true}).click()
  await page.waitForFunction(expected=>document.querySelector('[data-editor-source]').textContent===expected,CALL_SHEET.replace('# Plausible','# Draft: Plausible'))
  const rows=source=>source.split('\n').filter(line=>line.startsWith('|'))
  assert.deepEqual(rows(await saved.textContent()),rows(CALL_SHEET));assert.equal(rows(await saved.textContent()).length,5)
  if(evidence)await page.screenshot({path:resolve(evidence,'editor-saved-all-table-rows.png')})
  await title.click();await page.keyboard.press('Control+z');await page.waitForFunction(expected=>document.querySelector('[data-editor-draft]').textContent===expected,CALL_SHEET)
  await page.getByRole('button',{name:'Save changes',exact:true}).click()
  await page.waitForFunction(expected=>document.querySelector('[data-editor-source]').textContent===expected,CALL_SHEET)
  assert.deepEqual(errors,[])
 }finally{await context.close();await browser.close();await host.close()}
})

// Real delegated DOM anchors, local theme inheritance, keyboard access and overflowing evidence.
for(const [theme,width] of [['light',1512],['dark',1512],['light',390],['dark',390]])test(`packed HoverCard preserves delegated reading and keyboard ${theme} ${width}`,{timeout:60_000},async()=>{
 const host=await openHost(),browser=await chromium.launch({headless:true});if(evidence)await mkdir(evidence,{recursive:true});const context=await browser.newContext({viewport:{width,height:900},...(evidence?{recordVideo:{dir:evidence,size:{width,height:900}}}:{})}),page=await context.newPage(),errors=[],began=Date.now();page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(host.url+'/?hover=1&theme='+theme+(width===390?'&measured=1':theme==='dark'?'&legacy=1':''));const trigger=page.getByRole('button',{name:'Preview measurement',exact:true});if(theme==='light'){await trigger.focus();await page.keyboard.press('x');await page.waitForTimeout(350);assert.equal(await page.locator('[data-hover-card]').count(),0,'replacing anchor cancels its pending intent');await page.reload();await trigger.focus();await page.keyboard.press('Delete');await page.waitForTimeout(350);assert.equal(await page.locator('[data-hover-card]').count(),0,'removing anchor cancels its pending intent');await page.reload();await trigger.hover();await page.mouse.move(0,0);await page.waitForTimeout(350);assert.equal(await page.locator('[data-hover-card]').count(),0,'leaving before open cancels its intent');await page.reload();await trigger.hover();await page.locator('[data-hover-card]').waitFor({state:'visible'});await trigger.focus();await page.keyboard.press('Delete');await page.locator('[data-hover-card]').waitFor({state:'hidden'});await page.waitForTimeout(350);assert.equal(await page.locator('[data-hover-card]').count(),0,'an already open preview retires with its anchor');await page.reload();}await trigger.hover();const card=page.locator('[data-hover-card]');await card.waitFor({state:'visible'});assert.equal(await card.evaluate(el=>getComputedStyle(el).getPropertyValue('--preview-sentinel').trim()),'local-theme');assert.equal(await card.locator('p').first().textContent(),'7.5s / $0.0004 / 1.2K / 2.0 KB');await card.hover();await page.mouse.wheel(0,300);await page.waitForFunction(()=>document.querySelector('[data-hover-card]').scrollTop>0);await page.mouse.wheel(0,-10000);await trigger.focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'Inspect retained evidence');await page.keyboard.press('Enter');assert.equal(await page.locator('[data-preview-selection]').textContent(),'Original source selected');await page.keyboard.press('Escape');await card.waitFor({state:'hidden'});await page.waitForFunction(()=>document.activeElement?.textContent==='Preview measurement');await page.waitForTimeout(350);assert.equal(await card.count(),0,'Escape must stay closed after focus returns');await page.keyboard.press('Tab');await trigger.focus();await card.waitFor({state:'visible'});await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('[data-hover-card]')).opacity)>=.99);assert.equal(await card.evaluate(el=>getComputedStyle(el).color),await page.locator('[data-local-theme]').evaluate(el=>getComputedStyle(el).color));const box=await card.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);assert.deepEqual(errors,[]);if(evidence)await page.screenshot({path:resolve(evidence,`hover-${theme}-${width}.png`)});await page.waitForTimeout(Math.max(0,10100-(Date.now()-began)));
 }catch(error){if(evidence){await page.screenshot({path:resolve(evidence,`hover-failure-${theme}-${width}.png`)});await writeFile(resolve(evidence,`hover-failure-${theme}-${width}.json`),JSON.stringify({error:String(error),active:await page.evaluate(()=>document.activeElement?.outerHTML),body:await page.locator('body').innerText(),errors},null,2))}throw error}finally{await context.close();await browser.close();await host.close()}
})

test('packed HoverCard closes its own card when moving to an unrelated open preview',{timeout:60_000},async()=>{
 const host=await openHost(),browser=await chromium.launch({headless:true});
 try{const page=await browser.newPage({viewport:{width:1512,height:982}});await page.goto(host.url+'/?siblings=1');const a=page.getByLabel('Preview card A'),b=page.getByLabel('Preview card B');await b.waitFor({state:'visible'});await page.getByRole('button',{name:'Preview A',exact:true}).hover();await a.waitFor({state:'visible'});await b.hover();await a.waitFor({state:'hidden'});assert.equal(await b.isVisible(),true,'the unrelated preview remains independently readable');await page.mouse.move(0,0);await b.waitFor({state:'hidden'});}finally{await browser.close();await host.close();}
});
test('packed HoverCard closes a mouse-focused trigger after pointer leave',{timeout:60_000},async()=>{
 const host=await openHost(),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1512,height:982},...(evidence?{recordVideo:{dir:evidence,size:{width:1512,height:982}}}:{})}),page=await context.newPage();
 try{await page.goto(host.url+'/?hover=1&legacy=1');const trigger=page.getByRole('button',{name:'Preview measurement',exact:true});await trigger.click();const card=page.locator('[data-hover-card]');await card.waitFor({state:'visible'});assert.equal(await trigger.evaluate(node=>node===document.activeElement),true);assert.equal(await trigger.evaluate(node=>node.matches(':focus-visible')),false,'the actual mouse click did not establish keyboard focus');await page.mouse.move(0,0);await page.waitForTimeout(350);assert.equal(await card.count(),0,'a mouse-focused trigger does not retain its departed preview');}
 catch(error){if(evidence){await page.screenshot({path:resolve(evidence,'mouse-focused-failure.png')});await writeFile(resolve(evidence,'mouse-focused-failure.json'),JSON.stringify({error:String(error),...await page.evaluate(()=>({focus:document.activeElement?.outerHTML,focusVisible:document.activeElement?.matches(':focus-visible'),cards:document.querySelectorAll('[data-hover-card]').length}))},null,2));}throw error;}
 finally{const video=page.video();await context.close();if(video&&evidence)await video.saveAs(resolve(evidence,'mouse-focused.webm'));await browser.close();await host.close();}
});
test('packed HoverCard retains an autofocus child while the pointer leaves',{timeout:60_000},async()=>{
 const host=await openHost(),browser=await chromium.launch({headless:true});
 try{const page=await browser.newPage();await page.goto(host.url+'/?hover=1&autofocus=1');await page.getByRole('button',{name:'Preview measurement',exact:true}).hover();const note=page.getByRole('textbox',{name:'Retained preview note'});await note.waitFor();await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Retained preview note');await page.mouse.move(0,0);await page.waitForTimeout(350);assert.equal(await note.isVisible(),true,'the focused owned content survives its close-intent deadline');await page.keyboard.type('Retained original edit');assert.equal(await note.inputValue(),'Retained original edit');await page.keyboard.press('Escape');await page.locator('[data-hover-card]').waitFor({state:'hidden'});await page.waitForTimeout(350);assert.equal(await page.locator('[data-hover-card]').count(),0);}finally{await browser.close();await host.close();}
});
test('packed time tokens preserve scoped calc, SVG, zero and missing copy budgets',{timeout:60_000},async()=>{
 const host=await openHost(),browser=await chromium.launch({headless:true});
 try{const page=await browser.newPage();await page.goto(host.url+'/?clock=1');await page.waitForFunction(()=>typeof window.readTimeToken==='function');const result=await page.evaluate(()=>{
  const scope=document.createElement('section');scope.style.cssText='--duration-fast:calc(.12s + 30ms);--interaction-feedback-budget:calc(100ms + .05s);--interaction-pending-delay:0ms;--interaction-long-work-delay:initial;--interaction-mutation-budget:1s';document.body.append(scope);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS(svg.namespaceURI,'path');svg.append(path);scope.append(svg);const children=scope.childElementCount,svgChildren=path.childElementCount;
  try{return {html:window.readTimeToken('--duration-fast',scope),svg:window.readTimeToken('--duration-fast',path),missing:window.readTimeToken('--absent-time',scope),budgets:window.readInteractionBudgets(scope),detached:window.readInteractionBudgets(document.implementation.createHTMLDocument().body),children:scope.childElementCount-children,svgChildren:path.childElementCount-svgChildren};}finally{scope.remove();}
 });assert.deepEqual(result,{html:150,svg:150,missing:undefined,budgets:{feedback:150,pending:0,longWork:undefined,mutation:1000},detached:{},children:0,svgChildren:0});}finally{await browser.close();await host.close();}
});
for (const touch of [false, true]) test(`packed HoverCard lets nested ${touch ? 'touch' : 'mouse'} row actions navigate`, {timeout:60_000}, async () => {
 const host=await openHost(),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:390,height:900},hasTouch:touch,...(evidence?{recordVideo:{dir:evidence,size:{width:390,height:900}}}:{})}),page=await context.newPage();
 try {
  await page.goto(host.url+'/?nested=1');const action=page.getByRole('button',{name:'Expand recorded tool',exact:true});
  if(touch)await action.tap();else await action.click();await page.waitForTimeout(350);
  assert.equal(await page.locator('[data-action-count]').innerText(),'1');assert.equal(await page.locator('[data-hover-card]').count(),0,'committing a nested row action never pins its preview');
  await page.getByRole('button',{name:'All agents',exact:true}).click();assert.equal(await page.locator('[data-route]').innerText(),'All agents');
  await page.locator('[data-tool-row]').hover();const card=page.locator('[data-hover-card]');await card.waitFor({state:'visible'});await page.keyboard.press('Escape');await card.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'All agents',exact:true}).focus();await page.keyboard.press('Tab');await card.waitFor({state:'visible'});await page.keyboard.press('Tab');await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('[data-action-count]').textContent==='2');await card.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'All agents',exact:true}).click();assert.equal(await page.locator('[data-route]').innerText(),'All agents');
  if(evidence)await page.screenshot({path:resolve(evidence,`nested-${touch?'touch':'mouse'}.png`)});
 } catch(error){if(evidence){await page.screenshot({path:resolve(evidence,`nested-failure-${touch?'touch':'mouse'}.png`)});await writeFile(resolve(evidence,`nested-failure-${touch?'touch':'mouse'}.json`),JSON.stringify({error:String(error),body:await page.locator('body').innerText()},null,2))}throw error}
 finally {await context.close();await browser.close();await host.close()}
});


for (const theme of ['light', 'dark']) for (const width of [1512, 390]) test(`packed expandable workspace keeps close and fullscreen controls distinct ${theme} ${width}`, { timeout: 60_000 }, async () => {
 const host = await openHost(), browser = await chromium.launch({ headless: true })
 if (evidence) await mkdir(evidence, { recursive: true })
 const context = await browser.newContext({ viewport: { width, height: 982 }, colorScheme: theme, ...(evidence ? { recordVideo: { dir: evidence, size: { width, height: 982 } } } : {}) })
 const page = await context.newPage(), errors = [], receipts = []
 page.on('pageerror', error => errors.push(error.message))
 const panel = page.locator('[data-expandable-panel]').first()
 const closeName = width === 390 ? 'Back to the run' : 'Close conversation'
 const inspector = page.locator('aside[aria-label="Recorded root conversation"]')
 const hit = async locator => locator.evaluate(node => {
   const b = node.getBoundingClientRect(), target = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)
   let visible = b.width > 0 && b.height > 0 && b.x >= 0 && b.y >= 0 && b.right <= innerWidth && b.bottom <= innerHeight
   for (let e = node; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) visible = false }
   return { rect: b.toJSON(), visible, hit: node === target || node.contains(target), target: target?.getAttribute('aria-label') }
 })
 try {
  await page.goto(host.url + '/?panels=1&theme=' + theme)
  await inspector.waitFor()
  const close = page.getByRole('button', { name: closeName, exact: true })
  receipts.push({ phase: 'initial-close', ...await hit(close) })
  assert.equal(receipts.at(-1).hit, true, 'the ordinary close target owns its center')
  await close.click(); await inspector.waitFor({ state: 'hidden' })
  assert.equal(await panel.getAttribute('data-expanded'), null)
  await page.getByRole('textbox', { name: 'Retained note' }).fill('Keep this exact note')
  const scroller = page.locator('.fw-scroller')
  await scroller.hover(); await page.mouse.wheel(0, 360); await page.waitForTimeout(100)
  await page.waitForFunction(() => document.querySelector('.fw-scroller').scrollTop > 0)
  const scrollBefore = await scroller.evaluate(node => node.scrollTop)
  assert.ok(scrollBefore > 0, 'the native wheel establishes a real scrolled position')
  await page.getByRole('textbox', { name: 'Retained note' }).click()
  const toggle = page.getByRole('button', { name: 'Expand Recorded timeline', exact: true })
  for (let i = 0; i < 6 && !await toggle.evaluate(node => node === document.activeElement); i++) await page.keyboard.press('Tab')
  assert.equal(await toggle.evaluate(node => node === document.activeElement), true)
  receipts.push({ phase: 'keyboard-expand', ...await hit(toggle), scrollBefore })
  assert.equal(receipts.at(-1).hit && receipts.at(-1).visible, true, 'the keyboard-focused toggle remains visible and reachable')
  await page.keyboard.press('Enter')
  assert.equal(await panel.getAttribute('data-expanded'), '')
  const full = await panel.boundingBox(); assert.ok(Math.abs(full.x) <= 1 && Math.abs(full.y) <= 1 && Math.abs(full.width - width) <= 1 && Math.abs(full.height - 982) <= 1, 'expanded panel fills the viewport')
  assert.equal(await page.getByRole('textbox', { name: 'Retained note' }).inputValue(), 'Keep this exact note')
  assert.ok(Math.abs(await scroller.evaluate(node => node.scrollTop) - scrollBefore) <= 2, 'expansion retains the chart scroll')
  await page.getByRole('button', { name: 'Reopen conversation', exact: true }).click()
  await inspector.waitFor()
  receipts.push({ phase: 'expanded-close', ...await hit(close) })
  assert.equal(receipts.at(-1).hit, true)
  await close.click(); await inspector.waitFor({ state: 'hidden' })
  assert.equal(await panel.getAttribute('data-expanded'), '', 'closing the conversation does not collapse the panel')
  await page.getByRole('button', { name: 'Close full screen Recorded timeline', exact: true }).click()
  assert.equal(await panel.getAttribute('data-expanded'), null)
  assert.equal(await toggle.evaluate(node => node === document.activeElement), true, 'collapse returns focus to the control')
  assert.equal(await page.getByRole('textbox', { name: 'Retained note' }).inputValue(), 'Keep this exact note')
  assert.ok(Math.abs(await scroller.evaluate(node => node.scrollTop) - scrollBefore) <= 2, 'collapse retains the real chart scroll')
  await page.keyboard.press('Space'); assert.equal(await panel.getAttribute('data-expanded'), '')
  await page.getByRole('button', { name: 'Reopen conversation', exact: true }).click(); await inspector.waitFor()
  await inspector.locator('summary').click(); await page.keyboard.press('Escape'); await inspector.waitFor({ state: 'hidden' })
  assert.equal(await panel.getAttribute('data-expanded'), '', 'inspector Escape does not collapse its containing panel')
  await page.keyboard.press('Escape'); assert.equal(await panel.getAttribute('data-expanded'), null)
  assert.equal(await toggle.evaluate(node => node === document.activeElement), true)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  assert.deepEqual(errors, [])
  if (evidence) await page.screenshot({ path: resolve(evidence, `panel-${theme}-${width}.png`) })
 } catch (error) {
  if (evidence) await page.screenshot({ path: resolve(evidence, `panel-${theme}-${width}-failure.png`) })
  throw error
 } finally {
  if (evidence) await writeFile(resolve(evidence, `panel-${theme}-${width}.json`), JSON.stringify({ receipts, errors }, null, 2))
  const video = page.video(); await context.close()
  if (video && evidence) await video.saveAs(resolve(evidence, `panel-${theme}-${width}.webm`))
  await browser.close(); await host.close()
 }
})


for (const theme of ['light', 'dark']) for (const width of [1512, 390]) test(`packed Command preserves namespace, search, duplicate IDs and offscreen keyboard reach ${theme} ${width}`, { timeout: 60_000 }, async () => {
 const host = await openHost(), browser = await chromium.launch({ headless: true })
 if (evidence) await mkdir(evidence, { recursive: true })
 const context = await browser.newContext({ viewport: { width, height: 982 }, colorScheme: theme, ...(evidence ? { recordVideo: { dir: evidence, size: { width, height: 982 } } } : {}) })
 const page = await context.newPage(), errors = [], facts = {}
 page.on('pageerror', error => errors.push(error.message))
 const trigger = page.getByRole('button', { name: 'Choose recorded item', exact: true })
 const input = page.getByRole('combobox', { name: 'Find recorded item', exact: true })
 const selected = page.locator('[data-command-selected]'), commits = page.locator('[data-command-commits]')
 try {
  await page.goto(host.url + '/?command=1&theme=' + theme)
  assert.equal(await page.locator('[data-command-identity]').innerText(), 'true', 'the public namespace and parts are the exact upstream bindings')
  facts.motion = []
  for (const preference of ['no-preference', 'reduce', 'no-preference']) {
   await page.emulateMedia({ reducedMotion: preference })
   await page.waitForFunction(reduce => { const icon=document.querySelector('[data-proof-status]');return matchMedia('(prefers-reduced-motion: reduce)').matches===reduce && icon?.getAnimations().filter(a=>a.playState==='running').length===(reduce?0:1) }, preference==='reduce')
   const before=await page.locator('[data-status-clock],[data-status-stream]').allTextContents()
   await page.waitForFunction(before=>[...document.querySelectorAll('[data-status-clock],[data-status-stream]')].every((node,i)=>Number(node.textContent)>Number(before[i])),before)
   const state=await page.locator('[data-proof-status]').evaluate(icon=>({label:icon.getAttribute('aria-label'),visible:icon.checkVisibility(),animations:icon.getAnimations().filter(a=>a.playState==='running').map(a=>a.animationName)}))
   assert.equal(state.label,'Running');assert.equal(state.visible,true);assert.deepEqual(state.animations,preference==='reduce'?[]:['tangle-breathe'])
   facts.motion.push({preference,...state,liveBefore:before,liveAfter:await page.locator('[data-status-clock],[data-status-stream]').allTextContents()})
   if(evidence)await page.screenshot({path:resolve(evidence,`status-motion-${facts.motion.length}-${theme}-${width}.png`)})
  }
  await page.keyboard.press('Tab'); assert.equal(await trigger.evaluate(node => node === document.activeElement), true)
  await page.keyboard.press('Enter'); await input.waitFor()
  assert.equal(await input.evaluate(node => node === document.activeElement), true)
  assert.deepEqual(await page.evaluate(() => window.commandRefs()), { root: true, input: true }, 'refs reach the real root and input elements')
  assert.equal(await page.getByRole('option').count(), 1000)
  assert.deepEqual(await page.locator('[cmdk-group-heading]').allTextContents(), ['Workers', 'Reviewers'])
  const headingStyle=locator=>locator.first().evaluate(node=>{const style=getComputedStyle(node);return [style.padding,style.color,style.fontSize]});assert.deepEqual(await headingStyle(page.locator('[data-command-group-heading]')),await headingStyle(page.locator('[cmdk-group-heading]')))
  const list = page.getByRole('listbox', { name: 'Recorded choices', exact: true })
  const bounds = await list.evaluate(node => ({ height: node.clientHeight, scroll: node.scrollHeight })); facts.bounds = bounds
  assert.ok(bounds.height > 0 && bounds.height < 500 && bounds.scroll > bounds.height * 10, 'the scroll viewport stays bounded while cmdk registers all choices')
  if (evidence) await page.screenshot({ path: resolve(evidence, `command-open-${theme}-${width}.png`) })
  await page.keyboard.press('End')
  const last = page.locator('[cmdk-item][data-selected="true"]')
  await page.waitForFunction(() => document.querySelector('[cmdk-item][data-selected="true"]')?.getAttribute('data-value') === 'beta:0499')
  assert.equal(await last.evaluate(node => { const b = node.getBoundingClientRect(), p = node.closest('[cmdk-list]').getBoundingClientRect(); return b.top >= p.top - 1 && b.bottom <= p.bottom + 1 }), true)
  assert.equal(await selected.innerText(), 'alpha:0000'); assert.equal(await commits.innerText(), '0', 'highlighting never commits selection')
  await page.keyboard.press('Enter'); await input.waitFor({ state: 'hidden' })
  assert.equal(await selected.innerText(), 'beta:0499'); assert.equal(await commits.innerText(), '1')
  assert.equal(await trigger.evaluate(node => node === document.activeElement), true)
  await trigger.click(); await input.fill('Duplicate choice')
  await page.waitForFunction(() => document.querySelectorAll('[cmdk-item]').length === 2)
  if (evidence) await page.screenshot({ path: resolve(evidence, `command-filtered-${theme}-${width}.png`) })
  await page.keyboard.press('End'); await page.keyboard.press('Enter')
  await input.waitFor({ state: 'hidden' }); assert.equal(await selected.innerText(), 'alpha:0001'); assert.equal(await commits.innerText(), '2')
  await trigger.click(); await input.fill('unmatchable-needle-xyz')
  await page.getByRole('status').filter({ hasText: 'No choices found.' }).waitFor()
  assert.equal(await page.getByRole('option').count(), 0)
  if (evidence) await page.screenshot({ path: resolve(evidence, `command-empty-${theme}-${width}.png`) })
  await page.keyboard.press('Enter'); assert.equal(await commits.innerText(), '2')
  await page.keyboard.press('Escape'); await input.waitFor({ state: 'hidden' })
  assert.equal(await trigger.evaluate(node => node === document.activeElement), true)
  await trigger.click(); await input.fill('alpha:0015')
  await page.getByRole('option', { name: 'Worker 0015', exact: true }).click()
  await input.waitFor({ state: 'hidden' }); assert.equal(await selected.innerText(), 'alpha:0015'); assert.equal(await commits.innerText(), '3')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  assert.deepEqual(errors, []); facts.passed = true; facts.selection = await selected.innerText(); facts.commits = await commits.innerText()
  if (evidence) await page.screenshot({ path: resolve(evidence, `command-${theme}-${width}.png`) })
 } catch (error) {
  if (evidence) await page.screenshot({ path: resolve(evidence, `command-${theme}-${width}-failure.png`) })
  throw error
 } finally {
  if (evidence) await writeFile(resolve(evidence, `command-${theme}-${width}.json`), JSON.stringify({ ...facts, errors }, null, 2))
  const video = page.video(); await context.close()
  if (video && evidence) await video.saveAs(resolve(evidence, `command-${theme}-${width}.webm`))
  await browser.close(); await host.close()
 }
})
