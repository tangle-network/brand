import type { Meta, StoryObj } from '@storybook/react'
import { Info } from 'lucide-react'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { Label } from './label'
import { Separator } from './separator'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

const meta: Meta = {
  title: 'Primitives/Checkbox, Separator, Sheet, Tooltip',
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj

export const Checkboxes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        { id: 'a', label: 'Record a video of every run', checked: true },
        { id: 'b', label: 'Retry failed steps once', checked: false },
        { id: 'c', label: 'Select every suite in this workspace', checked: 'indeterminate' as const },
        { id: 'd', label: 'Disabled until billing is set up', checked: false, disabled: true },
      ].map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <Checkbox id={row.id} defaultChecked={row.checked} disabled={row.disabled} />
          <Label htmlFor={row.id}>{row.label}</Label>
        </div>
      ))}
    </div>
  ),
}

export const Separators: Story = {
  render: () => (
    <div className="w-72 text-sm">
      <p>Account</p>
      <Separator className="my-3" />
      <div className="flex h-5 items-center gap-3">
        <span>Runs</span>
        <Separator orientation="vertical" />
        <span>Suites</span>
        <Separator orientation="vertical" />
        <span>Settings</span>
      </div>
    </div>
  ),
}

export const Sheets: Story = {
  render: () => (
    <div className="flex gap-2">
      {(['left', 'right', 'bottom'] as const).map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button variant="outline">Open {side}</Button>
          </SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>Run assistant</SheetTitle>
              <SheetDescription>Ask why a step failed or what to test next.</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <Button>Send</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  ),
}

export const Tooltips: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex gap-2">
        {['Runs', 'Test suites', 'A much longer label that wraps at the maximum tooltip width'].map((label) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" aria-label={label}>
                <Info className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  ),
}
