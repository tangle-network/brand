import * as React from "react";
import { createRoot } from "react-dom/client";
import { jsx } from "hono/jsx/jsx-runtime";
import { TangleKnot } from "../../packages/brand/src/logo";
import { Heading } from "../../packages/ui/src/primitives/heading";
import { Button } from "../../packages/ui/src/primitives/button";
import "./design-contract.css";
const params = new URLSearchParams(location.search);
const renderer = params.get("renderer") ?? "react";
document.documentElement.dataset.theme = `tangle-${params.get("theme") ?? "dark"}`;
function Intro() {
 return <header className="mx-auto max-w-4xl px-6 py-20 text-center">
 <TangleKnot size={48}/><Heading variant="display">One API for model inference</Heading>
 <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">Standard requests use managed providers. Select an operator route when you need one.</p>
 <div className="mt-10 flex flex-wrap justify-center gap-3"><Button size="lg">Get API Key</Button><Button size="lg" variant="outline">Explore Models</Button></div>
 </header>;
}
const target = document.getElementById("root")!;
if (renderer === "react") createRoot(target).render(<Intro/>);
else target.innerHTML = jsx("header", {class: "mx-auto max-w-4xl px-6 py-20 text-center", children: [jsx("h1", {class:"text-3xl",children:"One API for model inference"}), jsx("p", {children:"Prior release: no framework-neutral expressive presentation or knot export."})]}).toString();
