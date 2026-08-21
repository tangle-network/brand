/**
 * Resolves the optional peers behind the `./editor` entry.
 *
 * A bundler resolves an uninstalled optional peer to a stub module that
 * carries a default export only and throws when it evaluates. One static
 * `import { EditorContent } from "@tiptap/react"` therefore fails the build of
 * every consumer that does not install tiptap, even when nothing renders an
 * editor. Every value taken from an optional peer must arrive through the
 * dynamic `import()` calls in this module, and each component is built from
 * the loaded namespaces. Type-only imports are erased, so they stay allowed.
 *
 * The two loaders keep the local editor independent of the collaboration
 * stack: a consumer that installs only tiptap can edit markdown locally, and
 * pays for yjs and Hocuspocus only when it renders the collaborative editor.
 *
 * Each component wraps one loader in a module-scope `React.lazy`. A missing
 * peer is a permanent condition, so the rejection that `lazy` caches stays
 * true, and it reaches the consumer's error boundary with the install list.
 */

import type * as Hocuspocus from "@hocuspocus/provider";
import type * as TiptapCollaboration from "@tiptap/extension-collaboration";
import type * as TiptapCollaborationCaret from "@tiptap/extension-collaboration-caret";
import type * as TiptapReact from "@tiptap/react";
import type * as TiptapStarterKit from "@tiptap/starter-kit";
import type * as Yjs from "yjs";

/** Namespaces the local markdown editor needs. */
export interface DocumentEditorPeers {
  react: typeof TiptapReact;
  starterKit: typeof TiptapStarterKit;
}

/** Namespaces the collaborative editor needs, on top of the local set. */
export interface CollaborationPeers extends DocumentEditorPeers {
  collaboration: typeof TiptapCollaboration;
  collaborationCaret: typeof TiptapCollaborationCaret;
  hocuspocus: typeof Hocuspocus;
  yjs: typeof Yjs;
}

const DOCUMENT_PEERS_MISSING =
  "@tangle-network/ui/editor needs its optional editor peers. " +
  "Install @tiptap/react and @tiptap/starter-kit.";

const COLLABORATION_PEERS_MISSING =
  "@tangle-network/ui/editor needs its optional collaboration peers. " +
  "Install @tiptap/react, @tiptap/starter-kit, @tiptap/extension-collaboration, " +
  "@tiptap/extension-collaboration-caret, @hocuspocus/provider and yjs.";

/** The messages a bundler or a runtime gives for a module it cannot resolve. */
const RESOLUTION_FAILURE =
  /could not resolve|cannot find (?:module|package)|can't resolve|failed to resolve|module not found/i;

/**
 * True when the rejection says the package is not installed. Only such an
 * error gets the install list: a transient chunk-fetch failure that reads as
 * "install the peers" sends the reader to the wrong fix. An error this
 * predicate does not match keeps its own message, so it can only
 * under-report.
 */
export function isMissingPeerError(error: unknown): boolean {
  return error instanceof Error && RESOLUTION_FAILURE.test(error.message);
}

async function loadPeers<T>(
  load: () => Promise<T>,
  missingMessage: string,
): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (isMissingPeerError(error)) {
      throw new Error(missingMessage, { cause: error });
    }
    throw error;
  }
}

/**
 * A bundler can also stub a missing optional peer as a silent empty namespace
 * instead of a throwing module. Read the members the editor calls, so that
 * shape also fails with the install list, and not as an undefined-property
 * crash in the middle of a render.
 */
function assertDocumentEditorPeers(
  peers: DocumentEditorPeers,
  missingMessage: string,
): void {
  if (
    typeof peers.react.useEditor !== "function" ||
    peers.react.EditorContent === undefined ||
    peers.starterKit.default === undefined
  ) {
    throw new Error(missingMessage);
  }
}

function assertCollaborationPeers(peers: CollaborationPeers): void {
  assertDocumentEditorPeers(peers, COLLABORATION_PEERS_MISSING);
  if (
    peers.collaboration.default === undefined ||
    peers.collaborationCaret.default === undefined ||
    typeof peers.hocuspocus.HocuspocusProvider !== "function" ||
    typeof peers.yjs.Doc !== "function"
  ) {
    throw new Error(COLLABORATION_PEERS_MISSING);
  }
}

async function importDocumentEditorPeers(): Promise<DocumentEditorPeers> {
  const [react, starterKit] = await Promise.all([
    import("@tiptap/react"),
    import("@tiptap/starter-kit"),
  ]);
  return { react, starterKit };
}

/** Resolve the local markdown editor's peers, or throw and name them. */
export async function loadDocumentEditorPeers(): Promise<DocumentEditorPeers> {
  const peers = await loadPeers(importDocumentEditorPeers, DOCUMENT_PEERS_MISSING);
  assertDocumentEditorPeers(peers, DOCUMENT_PEERS_MISSING);
  return peers;
}

/** Resolve the collaborative editor's peers, or throw and name them. */
export async function loadCollaborationPeers(): Promise<CollaborationPeers> {
  const peers = await loadPeers(async () => {
    const [documentPeers, collaboration, collaborationCaret, hocuspocus, yjs] =
      await Promise.all([
        importDocumentEditorPeers(),
        import("@tiptap/extension-collaboration"),
        import("@tiptap/extension-collaboration-caret"),
        import("@hocuspocus/provider"),
        import("yjs"),
      ]);
    return { ...documentPeers, collaboration, collaborationCaret, hocuspocus, yjs };
  }, COLLABORATION_PEERS_MISSING);
  assertCollaborationPeers(peers);
  return peers;
}
