import type { Meta, StoryObj } from '@storybook/react'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'
import { Button } from './button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from './context-menu'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Slider } from './slider'

const meta: Meta = {
  title: 'Primitives/Popover, Collapsible, AlertDialog, ContextMenu, Slider',
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj

const LONG_NAME = 'customer-onboarding-agent-with-a-very-long-project-name-that-never-wraps-on-its-own'

export const PopoverWithLongContent: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Project details</Button>
      </PopoverTrigger>
      <PopoverContent className="[overflow-wrap:anywhere]">
        <p className="font-medium text-sm">{LONG_NAME}</p>
        <p className="mt-1 text-muted-foreground text-sm">Created by a teammate. Last deployed from the develop branch.</p>
      </PopoverContent>
    </Popover>
  ),
}

export const CollapsibleSection: Story = {
  render: () => (
    <Collapsible className="w-80">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 text-sm">
        <ChevronRight className="size-4 transition-transform group-data-[state=open]:rotate-90" />
        Advanced settings
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 text-muted-foreground text-sm">
        Retry each failed step once before the run is marked failed.
      </CollapsibleContent>
    </Collapsible>
  ),
}

export const DestructiveConfirm: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete project</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {LONG_NAME}?</AlertDialogTitle>
          <AlertDialogDescription>Its sandboxes stop and its deployments are removed.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction tone="destructive">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const FileContextMenu: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-24 w-72 items-center justify-center rounded-lg border border-border border-dashed text-muted-foreground text-sm">
        Right-click this file
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem>
          Rename <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>Copy path</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem tone="destructive">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
}

function RangeDemo() {
  const [value, setValue] = useState([20, 80])
  return (
    <div className="w-72 space-y-2">
      <Slider value={value} onValueChange={setValue} thumbLabels={['Minimum', 'Maximum']} />
      <p className="text-muted-foreground text-sm">
        {value[0]} to {value[1]}
      </p>
    </div>
  )
}

export const Sliders: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <Slider aria-label="Temperature" defaultValue={[40]} className="w-72" />
      <RangeDemo />
      <Slider aria-label="Disabled" defaultValue={[60]} disabled className="w-72" />
    </div>
  ),
}
