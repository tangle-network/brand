import * as React from "react";
import { createRoot } from "react-dom/client";
import { jsx } from "hono/jsx/jsx-runtime";
import { CodeBlock,CopyButton } from "../../packages/ui/src/markdown/code-block";
import { ApiSchema } from "../../packages/ui/src/markdown/api-schema";
import { apiMetadataText,type ApiMetadata,highlightCode,codePreStyle,codeTextStyle,codePresentation,bindCopyButton,bindCodeTabs,schemaRows,type ApiField } from "../../packages/ui/src/code-presentation";
const params=new URLSearchParams(location.search),before=params.get("phase")==="before";
const examples=[{"label": "curl", "language": "bash", "code": "curl https://example.invalid/v1/chat \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}'"}, {"label": "TypeScript", "language": "ts", "code": "const body = { messages: [{ role: \"user\", content: \"Hello\" }] };\nconsole.log(JSON.stringify(body));"}, {"label": "Python", "language": "python", "code": "body = {\"messages\": [{\"role\": \"user\", \"content\": \"Hello\"}]}\nprint(body)"}];
const fields:ApiField[]=[{name:"messages",type:"array",required:true,description:"Example request messages",children:[{name:"content",type:"string",required:true,description:"The text to send."}]}];
const sse='data: {"delta":"Hello"}\n\ndata: [DONE]\n';
const binary='HTTP/1.1 200 OK\nContent-Type: audio/wav\n\n<binary response; save as output.wav>';
const errorJson='{"error":{"message":"Example failure"}}';
const longLine=JSON.stringify({content:"long_token_".repeat(100)});
function Page(){return <main className="mx-auto min-w-0 max-w-3xl space-y-6 p-6">
 <h1 className="tangle-heading" data-variant="page">API presentation fixture</h1>
 <p>Illustrative examples; this fixture sends no API requests.</p>
 <CodeBlock code={examples[0].code} language="bash" examples={before?undefined:examples} metadata={before?undefined:{kind:"request",method:"POST",contentType:"application/json"}}>{before&&<CopyButton text={examples[0].code}/>}</CodeBlock>
 {!before&&<ApiSchema fields={fields}/>}
 <CodeBlock code={sse} label="SSE response" metadata={before?undefined:{kind:"response",contentType:"text/event-stream"}}><CopyButton text={sse}/></CodeBlock>
 <CodeBlock code={binary} label="Binary response" metadata={before?undefined:{kind:"response",status:200,contentType:"audio/wav"}}><CopyButton text={binary}/></CodeBlock>
 <CodeBlock code={errorJson} language="json" label="Error response" metadata={before?undefined:{kind:"error",status:400,contentType:"application/json"}}>{!before&&<CopyButton text={errorJson}/>}</CodeBlock>
 <CodeBlock code={longLine} language="json" label="Long JSON line"><CopyButton text={longLine}/></CodeBlock>
 </main>}
const target=document.getElementById("root")!;
if(params.get("renderer")==="react")createRoot(target).render(<Page/>);
else {
 const h=jsx,codes=new Map<string,string>();
 async function block(code:string,language:string|undefined,label:string,id:string,metadata?:ApiMetadata){
  codes.set(id,code);
  const lines=await highlightCode(code,language);
  return h("div",{class:codePresentation.root,children:[h("div",{class:codePresentation.header,children:[metadata?apiMetadataText(metadata):label,h("button",{type:"button",class:codePresentation.copy,"aria-label":"Copy to clipboard","data-copy":id,children:"Copy"}),h("span",{role:"status",class:codePresentation.copyStatus,"aria-live":"polite","data-status":id})]}),h("pre",{role:"region","aria-label":`${label} code`,tabindex:0,style:codePreStyle,children:h("code",{style:codeTextStyle,children:lines.map((line,index)=>[...line.map(token=>h("span",{style:token.style,children:token.content})),index<lines.length-1?"\n":""])})})]});
 }
 const panels=await Promise.all(examples.map((e,i)=>block(e.code,e.language,e.label,`example-${i}`,{kind:"request",method:"POST",contentType:"application/json"})));
 const tabs=h("div",{role:"tablist","aria-label":"Code examples",class:codePresentation.tabs,id:"examples",children:examples.map((e,i)=>h("button",{role:"tab",type:"button",class:codePresentation.tab,"data-state":i===0?"active":"inactive",id:`tab-${i}`,"aria-controls":`panel-${i}`,"aria-selected":i===0,tabindex:i===0?0:-1,children:e.label}))});
 const schema=h("dl",{class:"tangle-api-schema","aria-label":"Schema",children:schemaRows(fields).map(f=>h("div",{style:{paddingInlineStart:`${f.depth}rem`},children:[h("dt",{children:[h("code",{children:f.path}),h("span",{children:` ${f.type}${f.required?" · required":""}`})]}),h("dd",{children:f.description})]}))});
 target.innerHTML=h("main",{class:"mx-auto min-w-0 max-w-3xl space-y-6 p-6",children:[h("h1",{class:"tangle-heading","data-variant":"page",children:"API presentation fixture"}),h("p",{children:"Illustrative examples; this fixture sends no API requests."}),tabs,...panels.map((panel,i)=>h("div",{id:`panel-${i}`,role:"tabpanel","aria-labelledby":`tab-${i}`,hidden:i!==0,children:panel})),schema,await block(sse,undefined,"SSE response","sse",{kind:"response",contentType:"text/event-stream"}),await block(binary,undefined,"Binary response","binary",{kind:"response",status:200,contentType:"audio/wav"}),await block(errorJson,"json","Error response","error",{kind:"error",status:400,contentType:"application/json"}),await block(longLine,"json","Long JSON line","long")] }).toString();
 bindCodeTabs(document.getElementById("examples")!);
 for(const button of target.querySelectorAll<HTMLButtonElement>("[data-copy]")){const id=button.dataset.copy!;bindCopyButton(button,target.querySelector(`[data-status="${id}"]`)!,()=>{const code=codes.get(id);if(code===undefined)throw Error(`Unknown copy source ${id}`);return code;});}
}
(window as any).fixtureExamples=examples;

(window as any).fixtureCodes={sse,binary,error:errorJson,long:longLine};
