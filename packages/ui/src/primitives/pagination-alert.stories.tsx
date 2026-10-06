import type { Meta, StoryObj } from '@storybook/react'
import { Info, TriangleAlert } from 'lucide-react'
import * as React from 'react'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { Pagination } from './pagination'

const meta: Meta = {
  title: 'Primitives/Pagination and Alert',
}
export default meta

function PagedTable({ pageCount }: { pageCount: number }) {
  const [page, setPage] = React.useState(0)
  return <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
}

export const PaginationLengths: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6 text-foreground">
      <PagedTable pageCount={1} />
      <PagedTable pageCount={4} />
      <PagedTable pageCount={48} />
      <PagedTable pageCount={1200} />
    </div>
  ),
}

export const AlertTones: StoryObj = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-3 bg-background p-6 text-foreground">
      <Alert icon={<Info />}>
        <AlertTitle>Public events</AlertTitle>
        <AlertDescription>Anyone with the link can join a public event.</AlertDescription>
      </Alert>
      <Alert tone="info" icon={<Info />}>
        <AlertTitle>Applies from the next billing cycle</AlertTitle>
      </Alert>
      <Alert tone="success">
        <AlertDescription>Changes saved.</AlertDescription>
      </Alert>
      <Alert tone="warning" icon={<TriangleAlert />}>
        <AlertTitle>A_very_long_policy_identifier_without_any_spaces_that_has_to_wrap_inside_the_alert</AlertTitle>
        <AlertDescription>Seats above the limit are removed when the cycle closes.</AlertDescription>
      </Alert>
      <Alert tone="danger" icon={<TriangleAlert />}>
        <AlertTitle>Could not save the policy</AlertTitle>
        <AlertDescription>The server refused the change. Try again.</AlertDescription>
      </Alert>
    </div>
  ),
}
