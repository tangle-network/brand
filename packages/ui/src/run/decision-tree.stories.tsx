import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Bot, CircleDollarSign, GitBranch, Megaphone, MessageSquare, PauseCircle, PhoneCall, Server } from 'lucide-react'
import { DecisionTree, type Decision } from './decision-tree'

const decisions: Decision[] = [
  {
    id: 'deploy',
    agent: { name: 'Release agent', model: 'Opus 5.5', icon: <Bot /> },
    risk: 'high',
    question: 'Sign-ups fell 40% after deploy #913. Roll it back?',
    context: '1,320 sign-up attempts failed in 20 minutes · about 90 lost accounts an hour.',
    options: [
      {
        id: 'rollback', label: 'Roll back to #912', icon: <GitBranch />, recommended: true,
        followUp: {
          question: 'Tell users?',
          options: [
            { id: 'banner', label: 'Show a sign-up banner', detail: 'Public · until the fix ships', icon: <Megaphone />, recommended: true },
            { id: 'quiet', label: 'Only tell support', detail: '#support only · nothing public', icon: <MessageSquare /> },
          ],
        },
      },
      { id: 'flag', label: 'Turn off the new form', detail: 'Feature flag · keeps the rest of #913', icon: <PauseCircle /> },
    ],
  },
  {
    id: 'renewal',
    agent: { name: 'Account agent', model: 'GPT-6 Sol', icon: <Bot /> },
    risk: 'medium',
    question: 'Northwind asks for 30% off a $120k renewal. How should I answer?',
    context: 'Renews in 6 days · 340 seats · usage up 18% this quarter.',
    options: [
      { id: 'hold', label: 'Hold the price', detail: 'Offer onboarding credits instead', icon: <CircleDollarSign />, recommended: true },
      {
        id: 'escalate', label: 'Ask the CFO', icon: <MessageSquare />,
        followUp: {
          question: 'What should I attach?',
          options: [
            { id: 'usage', label: 'Usage report', detail: 'Seats and growth by team', icon: <Server /> },
            { id: 'margin', label: 'Margin at 30% off', detail: 'Margin drops to 38%', caution: true, icon: <CircleDollarSign /> },
          ],
        },
      },
    ],
  },
  {
    id: 'batch',
    agent: { name: 'Infra agent', model: 'Gemini 3.8 Pro', icon: <Bot /> },
    risk: 'high',
    question: 'GPU spend tripled overnight: a stuck embedding job costs $260 an hour. What should I do?',
    context: 'The job embed-nightly has restarted 6,400 times since 01:40.',
    options: [
      { id: 'stop', label: 'Stop the job', detail: 'Snapshot kept · restart tonight', icon: <PauseCircle />, recommended: true },
      { id: 'cap', label: 'Cap spend at $50 an hour', detail: 'Slows 3 other jobs', caution: true, icon: <CircleDollarSign /> },
      { id: 'page', label: 'Page the on-call', detail: 'Wakes Priya · costs run until she is in', icon: <PhoneCall /> },
    ],
  },
]

const meta: Meta<typeof DecisionTree> = { title: 'Run/DecisionTree', component: DecisionTree, parameters: { layout: 'padded' } }
export default meta
type Story = StoryObj<typeof DecisionTree>

/** Choose with the keyboard (1–N) or the pointer; the host reports the agent's outcome a moment later. */
export const Waiting: Story = {
  render: () => {
    const [items, setItems] = useState(decisions)
    return <DecisionTree decisions={items} onDecide={(id, choice) => {
      setTimeout(() => setItems(previous => previous.map(item => item.id !== id ? item : {
        ...item,
        outcome: { state: 'done', label: 'Sent to the agent', message: 'instead' in choice ? `On it: ${choice.instead}` : 'On it. Snapshot saved; I will report back when it lands.' },
      })), 2400)
    }} />
  },
}

/** A decision already acted on: the chosen path and the agent's report. */
export const Answered: Story = {
  render: () => <DecisionTree decisions={[{ ...decisions[2]!, chosen: { path: ['stop'] }, outcome: { state: 'done', label: 'Sent to the infra agent', message: 'Stopped embed-nightly and saved a snapshot. It restarts at 23:00 when traffic is low.' } }]} onDecide={() => {}} />,
}
