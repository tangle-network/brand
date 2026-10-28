import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { FileTabs, type FileTabData } from './file-tabs'

const meta: Meta<typeof FileTabs> = { title: 'Files/FileTabs', component: FileTabs, parameters: { layout: 'fullscreen' } }
export default meta

const TABS: FileTabData[] = [
  { id: 'a', name: 'CHECK.md', path: 'code/route-a-lead-2/CHECK.md' },
  { id: 'b', name: 'CHECK.md', path: 'code/rs3-merge-lead/CHECK.md' },
  { id: 'c', name: 'approaches.md', path: 'pages/magnetar-rust/approaches.md' },
  { id: 'd', name: 'gaps.json', path: 'code/route-a-lead-2/gaps.json', dirty: true },
]

/** Two files of one name tell themselves apart by folder; inactive tabs keep their slot with a divider. */
export const SameNames: StoryObj<typeof FileTabs> = {
  render: () => {
    const [active, setActive] = useState('c')
    return (
      <div className="bg-[var(--bg-root)] p-6">
        <div className="rounded-[var(--radius-xl)] border border-border bg-background">
          <FileTabs tabs={TABS} activeId={active} onSelect={setActive} onClose={() => {}} />
          <div className="h-40 bg-card" />
        </div>
      </div>
    )
  },
}
