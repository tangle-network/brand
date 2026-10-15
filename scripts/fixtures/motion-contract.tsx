import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Button } from "../../packages/ui/src/primitives/button";
import { Input } from "../../packages/ui/src/primitives/input";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../../packages/ui/src/primitives/dialog";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../../packages/ui/src/primitives/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../packages/ui/src/primitives/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "../../packages/ui/src/primitives/popover";
function Fixture() {
 const [dialogOpen,setDialogOpen]=React.useState(false),[sheetOpen,setSheetOpen]=React.useState(false),[popoverOpen,setPopoverOpen]=React.useState(false);
 React.useEffect(()=>{(window as any).motionFixture={dialog:(open:boolean)=>flushSync(()=>setDialogOpen(open)),sheet:(open:boolean)=>flushSync(()=>setSheetOpen(open)),popover:(open:boolean)=>flushSync(()=>setPopoverOpen(open))};return()=>{delete (window as any).motionFixture;};},[]);
 return <main className="p-8 space-y-8">
  <h1>Shared motion contract</h1>
  <Button>Control</Button><Button variant="bare" data-testid="bare-control">Bare control</Button><Input aria-label="Field"/>
  <a href="#" className="tangle-control-display">Display control</a>
  <div className="tangle-intro" data-motion="">Arrival</div>
  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger><DialogContent aria-describedby={undefined}><DialogTitle>Dialog surface</DialogTitle><Input aria-label="Dialog field"/></DialogContent></Dialog>
  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}><SheetTrigger asChild><Button>Open sheet</Button></SheetTrigger><SheetContent aria-describedby={undefined}><SheetTitle>Sheet surface</SheetTitle><Input aria-label="Sheet field"/></SheetContent></Sheet>
  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}><PopoverTrigger asChild><Button>Open popover</Button></PopoverTrigger><PopoverContent aria-label="Popover surface"><Input aria-label="Popover field"/></PopoverContent></Popover>
  <TooltipProvider delayDuration={0}><Tooltip><TooltipTrigger asChild><Button>Hint</Button></TooltipTrigger><TooltipContent>Tooltip surface</TooltipContent></Tooltip></TooltipProvider>
 </main>;
}
createRoot(document.getElementById("root")!).render(<Fixture/>);
