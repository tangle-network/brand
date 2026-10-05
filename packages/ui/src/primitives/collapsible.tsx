"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

/**
 * Unstyled show/hide region. The trigger carries `aria-expanded` and
 * `data-state`, so a chevron can rotate with
 * `group-data-[state=open]:rotate-90` without local state.
 */
const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
