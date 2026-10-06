import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "../primitives/button";
import { FileCard } from "./file-card";
import { FileList, type FileListItem } from "./file-list";

const CASE_FILES: FileListItem[] = [
  {
    id: "lease",
    filename: "Commercial lease — 418 Harbor Street.pdf",
    size: 2_516_582,
    date: "2026-09-28T16:20:00Z",
    uploader: { name: "Dana Ruiz", role: "Client" },
  },
  {
    id: "notice",
    filename: "Notice of lease termination.pdf",
    size: 75_955,
    date: "2026-10-06T09:05:00Z",
    uploader: { name: "Priya Adeyemi", role: "Attorney" },
  },
  {
    id: "photos",
    filename: "Rear storage room, water damage.jpg",
    mimeType: "image/jpeg",
    size: 3_145_728,
    date: "2026-08-12T18:42:00Z",
    uploader: { name: "Dana Ruiz", role: "Client" },
  },
  {
    id: "ledger",
    filename: "Rent ledger 2023–2026.xlsx",
    size: 48_640,
    date: "2026-09-30T11:00:00Z",
    uploader: { name: "Coastal Property Holdings" },
  },
  {
    id: "estimate",
    filename: "Contractor estimate.docx",
    size: 182_000,
    date: "2026-08-20T14:10:00Z",
  },
];

function CaseDocuments() {
  const [files, setFiles] = useState(CASE_FILES);
  const [openId, setOpenId] = useState("notice");
  return (
    <FileList
      aria-label="Case documents"
      files={files}
      activeId={openId}
      onOpen={(file) => setOpenId(file.id)}
      onDownload={() => {}}
      onDelete={(file) => setFiles((current) => current.filter((item) => item.id !== file.id))}
      empty="No documents yet. Upload the lease to get started."
    />
  );
}

const meta: Meta<typeof FileList> = {
  title: "Files/FileList",
  component: FileList,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="min-h-[100dvh] bg-background p-4 text-foreground">
        <div className="mx-auto max-w-2xl">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FileList>;

export const Documents: Story = {
  name: "Case documents",
  render: () => <CaseDocuments />,
};

export const DocumentsLight: Story = {
  name: "Case documents (light)",
  globals: { theme: "light" },
  render: () => <CaseDocuments />,
};

export const ReadOnly: Story = {
  name: "Read-only list",
  render: () => <FileList aria-label="Shared with you" files={CASE_FILES.slice(0, 3)} />,
};

export const Empty: Story = {
  render: () => <FileList files={[]} empty="No documents yet. Upload the lease to get started." />,
};

export const Card: Story = {
  name: "FileCard",
  render: () => (
    <FileCard
      filename="Commercial lease — 418 Harbor Street.pdf"
      size={2_516_582}
      date="2026-09-28T16:20:00Z"
      uploader={{ name: "Dana Ruiz", role: "Client" }}
      onDownload={() => {}}
      actions={
        <Button type="button" size="sm">
          Open
        </Button>
      }
    />
  ),
};

export const CardLight: Story = {
  name: "FileCard (light)",
  globals: { theme: "light" },
  render: Card.render,
};
