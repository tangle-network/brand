import * as React from "react";
import { createRoot } from "react-dom/client";
import { jsx } from "hono/jsx/jsx-runtime";
import { PageShell } from "../../packages/ui/src/primitives/page-shell";
import { PageHeader } from "../../packages/ui/src/primitives/page-header";
import { Button } from "../../packages/ui/src/primitives/button";
import { Input } from "../../packages/ui/src/primitives/input";
import { MetricStrip, Metric } from "../../packages/ui/src/primitives/metric-strip";
import { EmptyState } from "../../packages/ui/src/primitives/empty-state";
import { Table, TableBody, TableRow, TableHead, TableHeader, TableCell } from "../../packages/ui/src/primitives/table";
import { bindDialog, labelVariants, helpPresentation, inputVariants, buttonVariants, tablePresentation as table, metricPresentation as metric, metricLayouts, emptyStatePresentation as empty } from "../../packages/ui/src/presentation";
const params=new URLSearchParams(location.search), before=params.get("phase")==="before";
const links=["Quickstart","Authentication","Errors"];
const desc="A shared reading frame. This is an isolated component fixture.";
function Navigation() {
 const dialog=React.useRef<HTMLDialogElement>(null),trigger=React.useRef<HTMLButtonElement>(null);
 React.useEffect(()=>bindDialog(dialog.current!,trigger.current!),[]);
 return <><Button ref={trigger}>Sections</Button><div>{links.map(t=><a key={t} href={`#${t.toLowerCase()}`}>{t}</a>)}</div>
 <dialog ref={dialog} id="sections" aria-labelledby="sections-title" className="tangle-native-dialog"><h2 id="sections-title">Sections</h2>{links.map(t=><a key={t} href={`#${t.toLowerCase()}`}>{t}</a>)}<Button data-dialog-close="">Close navigation</Button></dialog></>;
}
function Article(){return <>
 <PageHeader title="API keys" description={desc} presentation={before?undefined:"operational"}/>
 <Input size="lg" id="workspace" label="Workspace name" hint="Use a name you can recognize." placeholder="Example workspace"/>
 <MetricStrip columns={3}><Metric label="Available credit" value="—" hint="No account loaded"/><Metric label="API keys" value="—"/><Metric label="Requests" value="—"/></MetricStrip>
 <Table wrapperProps={{tabIndex:0,"aria-label":"Key examples"}}><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Access</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Example key</TableCell><TableCell>Read only</TableCell></TableRow></TableBody></Table>
 <EmptyState title="No API keys" description="Create a key to start sending requests." action={<Button>Create API key</Button>}/>
 </>}
const target=document.getElementById("root")!;
if(params.get("renderer")==="react")createRoot(target).render(before?<PageShell><Navigation/><Article/></PageShell>:<PageShell navigation={<Navigation/>} article={<Article/>} outline={<a href="#workspace">Workspace name</a>}/>);
else {
 const h=jsx, nav=h("div",{children:[h("button",{id:"sections-trigger",class:buttonVariants(),children:"Sections"}),...links.map(t=>h("a",{href:`#${t.toLowerCase()}`,children:t})),h("dialog",{id:"sections","aria-labelledby":"sections-title",class:"tangle-native-dialog",children:[h("h2",{id:"sections-title",children:"Sections"}),...links.map(t=>h("a",{href:`#${t.toLowerCase()}`,children:t})),h("button",{"data-dialog-close":"",class:buttonVariants(),children:"Close navigation"})]})]});
 const article=h("article",{class:"tangle-reading-article",children:[
 h("header",{class:"tangle-page-header",children:[h("h1",{class:"tangle-heading","data-variant":"page",children:"API keys"}),h("p",{class:"tangle-page-description",children:desc})]}),
 h("label",{for:"workspace",class:labelVariants(),children:"Workspace name"}),h("input",{id:"workspace",class:inputVariants({size:"lg"}),placeholder:"Example workspace","aria-describedby":"workspace-hint"}),h("p",{id:"workspace-hint",class:`${helpPresentation.root} ${helpPresentation.hint}`,children:"Use a name you can recognize."}),
 h("dl",{class:`${metric.strip} ${metricLayouts[3]}`,children:["Available credit","API keys","Requests"].map(label=>h("div",{class:metric.item,children:[h("dt",{class:metric.label,children:label}),h("dd",{class:metric.value,children:"—"})]}))}),
 h("div",{class:table.wrapper,tabindex:0,"aria-label":"Key examples",children:h("table",{class:table.root,children:[h("thead",{class:table.head,children:h("tr",{class:table.row,children:[h("th",{class:table.columnHeader,children:"Name"}),h("th",{class:table.columnHeader,children:"Access"})]})}),h("tbody",{class:table.body,children:h("tr",{class:table.row,children:[h("td",{class:table.cell,children:"Example key"}),h("td",{class:table.cell,children:"Read only"})]})})]})}),
 h("div",{class:empty.root,children:[h("h3",{class:empty.title,children:"No API keys"}),h("p",{class:empty.description,children:"Create a key to start sending requests."}),h("div",{class:empty.action,children:h("button",{class:buttonVariants(),children:"Create API key"})})]})
 ]});
 target.innerHTML=h("div",{class:"tangle-reading-shell",children:[h("nav",{class:"tangle-reading-nav","aria-label":"Sections",children:nav}),article,h("aside",{class:"tangle-reading-outline","aria-label":"On this page",children:h("a",{href:"#workspace",children:"Workspace name"})})]}).toString();
 bindDialog(document.getElementById("sections") as HTMLDialogElement,document.getElementById("sections-trigger")!);
}
