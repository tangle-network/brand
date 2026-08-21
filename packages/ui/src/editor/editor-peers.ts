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
 * A bundler still reads the literal specifier in a dynamic `import()`. Vite
 * and Rollup leave an unresolved one to run time on their own; esbuild does so
 * only when the call carries a `.catch()`. Every import below therefore
 * attaches `rethrow`. Webpack has no such rule and needs consumer
 * configuration, which `packages/ui/README.md` gives.
 *
 * Three loaders keep each surface independent of the peers it does not use. A
 * consumer that installs only tiptap can edit markdown locally. A consumer
 * that installs only yjs and Hocuspocus can drive its own editor from
 * `EditorProvider`'s context. Only the collaborative editor needs all six.
 *
 * A missing peer and a transient chunk fetch fail differently, so they carry
 * different types: a missing peer throws `MissingEditorPeersError`, which
 * `editor-lazy.ts` treats as permanent, and any other rejection keeps its own
 * error and stays retryable.
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

/**
 * Namespaces the collaboration transport needs. `EditorProvider` builds the
 * document and the socket from these two alone, so it must not wait on the
 * tiptap stack: a consumer can drive its own editor from the provider's
 * context with nothing else installed.
 */
export interface EditorProviderPeers {
  hocuspocus: typeof Hocuspocus;
  yjs: typeof Yjs;
}

/** Namespaces the collaborative editor needs, on top of the two sets above. */
export interface CollaborationPeers extends DocumentEditorPeers, EditorProviderPeers {
  collaboration: typeof TiptapCollaboration;
  collaborationCaret: typeof TiptapCollaborationCaret;
}

const DOCUMENT_PEERS_MISSING =
  "@tangle-network/ui/editor needs its optional editor peers. " +
  "Install @tiptap/react and @tiptap/starter-kit.";

const PROVIDER_PEERS_MISSING =
  "@tangle-network/ui/editor needs its optional collaboration transport peers. " +
  "Install @hocuspocus/provider and yjs.";

const COLLABORATION_PEERS_MISSING =
  "@tangle-network/ui/editor needs its optional collaboration peers. " +
  "Install @tiptap/react, @tiptap/starter-kit, @tiptap/extension-collaboration, " +
  "@tiptap/extension-collaboration-caret, @hocuspocus/provider and yjs.";

/**
 * A peer the editor needs is absent, or resolved to a stub that carries none
 * of the members the editor calls. The condition holds for the rest of the
 * session, because a package does not install itself mid-run.
 */
export class MissingEditorPeersError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "MissingEditorPeersError";
  }
}

/**
 * True for the error above. The name carries the answer, so a duplicated copy
 * of this module in a consumer's bundle still reports its own error correctly.
 */
export function isMissingEditorPeersError(error: unknown): boolean {
  return error instanceof Error && error.name === "MissingEditorPeersError";
}

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

/**
 * Hands an `import()` rejection on unchanged. esbuild reports an unresolvable
 * literal `import()` as a build error and defers it to run time only when the
 * call carries a `.catch()`, so every peer import attaches this handler. It
 * changes nothing at run time.
 */
function rethrow(error: unknown): never {
  throw error;
}

/**
 * Every optional peer the `./editor` entry needs at run time. The loaders
 * import all but `@tiptap/core`, which the tiptap packages need in turn: a
 * consumer that resolves it to nothing breaks the same way, so a failure that
 * names it is a missing peer too. `scripts/validate-dist.mjs` holds the same
 * list and rejects a build where the two disagree.
 */
const DEFERRED_PEERS = [
  "@tiptap/core",
  "@tiptap/react",
  "@tiptap/starter-kit",
  "@tiptap/extension-collaboration",
  "@tiptap/extension-collaboration-caret",
  "@hocuspocus/provider",
  "yjs",
];

/** Every deferred peer a resolution failure names. */
function unresolvedPeersFrom(error: unknown): string[] {
  if (!(error instanceof Error)) return [];
  const named = DEFERRED_PEERS.filter((name) => error.message.includes(name));
  // "@tiptap/extension-collaboration" is a prefix of the caret package, so a
  // message about the caret names both. Drop a name another match contains.
  return named.filter(
    (name) => !named.some((other) => other !== name && other.includes(name)),
  );
}

/**
 * Turns a rejection that names an unresolved peer into the install-list error,
 * and keeps the original as its cause. Any other rejection passes through, so
 * a transient chunk fetch keeps its own message and stays retryable.
 */
export function asMissingEditorPeersError(
  error: unknown,
  missingMessage: string,
): unknown {
  if (!isMissingPeerError(error)) return error;
  const unresolved = unresolvedPeersFrom(error);
  // A resolution failure that names none of the peers comes from somewhere
  // else: an application chunk, or a dependency of a peer that did load.
  // Installing the list would not fix it, and a later attempt can still
  // succeed, so it keeps its own error and stays retryable.
  if (unresolved.length === 0) return error;
  const detail =
    unresolved.length === 1 ? ` ${unresolved[0]} did not resolve.` : "";
  return new MissingEditorPeersError(missingMessage + detail, { cause: error });
}

async function loadPeers<T>(
  load: () => Promise<T>,
  missingMessage: string,
): Promise<T> {
  try {
    return await load();
  } catch (error) {
    throw asMissingEditorPeersError(error, missingMessage);
  }
}

/**
 * True for a tiptap extension the editor can configure. A bundler can stub a
 * missing optional peer as a silent namespace whose default export is an empty
 * object, which is defined but carries no `configure`. Reading the member the
 * factories call separates that shape from a real extension.
 */
function isConfigurableExtension(value: unknown): boolean {
  return typeof (value as { configure?: unknown } | undefined)?.configure === "function";
}

/**
 * Reads the members the editor calls, so a stub namespace fails with the
 * install list, and not as an undefined-property crash in the middle of a
 * render.
 */
function assertDocumentEditorPeers(
  peers: DocumentEditorPeers,
  missingMessage: string,
): void {
  if (
    typeof peers.react.useEditor !== "function" ||
    peers.react.EditorContent === undefined ||
    !isConfigurableExtension(peers.starterKit.default)
  ) {
    throw new MissingEditorPeersError(missingMessage);
  }
}

function assertEditorProviderPeers(
  peers: EditorProviderPeers,
  missingMessage: string,
): void {
  if (
    typeof peers.hocuspocus.HocuspocusProvider !== "function" ||
    typeof peers.yjs.Doc !== "function"
  ) {
    throw new MissingEditorPeersError(missingMessage);
  }
}

function assertCollaborationPeers(peers: CollaborationPeers): void {
  assertDocumentEditorPeers(peers, COLLABORATION_PEERS_MISSING);
  assertEditorProviderPeers(peers, COLLABORATION_PEERS_MISSING);
  if (
    !isConfigurableExtension(peers.collaboration.default) ||
    !isConfigurableExtension(peers.collaborationCaret.default)
  ) {
    throw new MissingEditorPeersError(COLLABORATION_PEERS_MISSING);
  }
}

async function importDocumentEditorPeers(): Promise<DocumentEditorPeers> {
  const [react, starterKit] = await Promise.all([
    import("@tiptap/react").catch(rethrow),
    import("@tiptap/starter-kit").catch(rethrow),
  ]);
  return { react, starterKit };
}

async function importEditorProviderPeers(): Promise<EditorProviderPeers> {
  const [hocuspocus, yjs] = await Promise.all([
    import("@hocuspocus/provider").catch(rethrow),
    import("yjs").catch(rethrow),
  ]);
  return { hocuspocus, yjs };
}

/** Resolve the collaboration transport's peers, or throw and name them. */
export async function loadEditorProviderPeers(): Promise<EditorProviderPeers> {
  const peers = await loadPeers(importEditorProviderPeers, PROVIDER_PEERS_MISSING);
  assertEditorProviderPeers(peers, PROVIDER_PEERS_MISSING);
  return peers;
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
    const [documentPeers, providerPeers, collaboration, collaborationCaret] =
      await Promise.all([
        importDocumentEditorPeers(),
        importEditorProviderPeers(),
        import("@tiptap/extension-collaboration").catch(rethrow),
        import("@tiptap/extension-collaboration-caret").catch(rethrow),
      ]);
    return { ...documentPeers, ...providerPeers, collaboration, collaborationCaret };
  }, COLLABORATION_PEERS_MISSING);
  assertCollaborationPeers(peers);
  return peers;
}
