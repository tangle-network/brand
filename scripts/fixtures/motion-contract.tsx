import * as React from "react";
import { createRoot } from "react-dom/client";
import { Button } from "../../packages/ui/src/primitives/button";
import { Input } from "../../packages/ui/src/primitives/input";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../../packages/ui/src/primitives/dialog";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../../packages/ui/src/primitives/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../packages/ui/src/primitives/tooltip";
function Fixture() {
 return <main className="p-8 space-y-8">
  <h1>Shared motion contract</h1>
  <Button>Control</Button><Input aria-label="Field"/>
  <a href="#" className="tangle-control-display">Display control</a>
  <div className="tangle-intro" data-motion="">Arrival</div>
  <Dialog><DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger><DialogContent aria-describedby={undefined}><DialogTitle>Dialog surface</DialogTitle><Input aria-label="Dialog field"/></DialogContent></Dialog>
  <Sheet><SheetTrigger asChild><Button>Open sheet</Button></SheetTrigger><SheetContent aria-describedby={undefined}><SheetTitle>Sheet surface</SheetTitle><Input aria-label="Sheet field"/></SheetContent></Sheet>
  <TooltipProvider delayDuration={0}><Tooltip><TooltipTrigger asChild><Button>Hint</Button></TooltipTrigger><TooltipContent>Tooltip surface</TooltipContent></Tooltip></TooltipProvider>
 </main>;
}
createRoot(document.getElementById("root")!).render(<Fixture/>);
