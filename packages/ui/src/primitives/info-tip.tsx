"use client";

import { Info } from "lucide-react";
import * as React from "react";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

/**
 * An info button beside a label, for help that explains a setting. It opens
 * on hover and keyboard focus and toggles on tap. The glyph stays 20px; on a
 * coarse pointer a transparent 44px hit area surrounds it. It brings its own
 * provider, so a row or field works in an app that never mounted one.
 */
export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  // Radix closes a tooltip on every trigger press and click; a tap or click toggles it instead.
  const openAtPress = React.useRef(false);
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="bare"
            aria-label={`About ${label}`}
            onPointerDown={() => { openAtPress.current = open; }}
            onClick={(event) => {
              event.preventDefault();
              setOpen(event.detail === 0 ? !open : !openAtPress.current);
            }}
            className="relative inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground pointer-coarse:before:absolute pointer-coarse:before:-inset-3 pointer-coarse:before:content-['']"
          >
            <Info aria-hidden="true" className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-72 text-sm leading-5">{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
