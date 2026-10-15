import * as React from "react";
import { createRoot } from "react-dom/client";
import { jsx } from "hono/jsx";
import { raw } from "hono/html";
import { TangleKnot } from "../../packages/brand/src/logo";
import { knotSvg } from "../../packages/brand/src/knot";
import "./design-contract.css";
const params = new URLSearchParams(location.search);
const renderer = params.get("renderer") ?? "react";
document.documentElement.dataset.theme = `tangle-${params.get("theme") ?? "dark"}`;
document.documentElement.dataset.typography = "expressive";
const title = "One API for model inference";
const description = "Standard requests use managed providers. Select an operator route when you need one.";
function Intro() {
 return <header className="tangle-intro" data-grid="" data-motion="">
 <TangleKnot size={640} className="tangle-intro-knot" label=""/>
 <h1 className="tangle-display" data-gradient="">{title}</h1>
 <p className="tangle-intro-description">{description}</p>
 <div className="tangle-intro-actions"><a href="#keys" className="tangle-control-display">Get API Key</a><a href="#models" className="tangle-control-display" data-variant="outline">Explore Models</a></div>
 </header>;
}
const target = document.getElementById("root")!;
if (params.get("surface") === "code") await import("./code-contract");
else if (params.get("surface") === "layout") await import("./layout-contract");
else if (renderer === "react") createRoot(target).render(<Intro/>);
else target.innerHTML = jsx("header", {class: "tangle-intro", "data-grid":"", "data-motion":"", children: [
 jsx("span",{class:"tangle-intro-knot",children:raw(knotSvg({id:"hono-intro",size:640}))}),
 jsx("h1",{class:"tangle-display","data-gradient":"",children:title}),
 jsx("p",{class:"tangle-intro-description",children:description}),
 jsx("div",{class:"tangle-intro-actions",children:[jsx("a",{href:"#keys",class:"tangle-control-display",children:"Get API Key"}),jsx("a",{href:"#models",class:"tangle-control-display","data-variant":"outline",children:"Explore Models"})]})
]}).toString();
