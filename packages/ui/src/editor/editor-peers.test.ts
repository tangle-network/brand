import { afterEach, describe, expect, it, vi } from "vitest";
import { isMissingPeerError } from "./editor-peers";

/** The namespace shape each peer has when it is installed. */
const installedPeers: Record<string, Record<string, unknown>> = {
  "@tiptap/react": { useEditor: () => null, EditorContent: () => null },
  "@tiptap/starter-kit": { default: { configure: () => ({}) } },
  "@tiptap/extension-collaboration": { default: { configure: () => ({}) } },
  "@tiptap/extension-collaboration-caret": { default: { configure: () => ({}) } },
  "@hocuspocus/provider": { HocuspocusProvider: class {} },
  yjs: { Doc: class {} },
};

/**
 * Loads the module under test with the named peers replaced. The loaders read
 * their peers through a dynamic import, so the substitution has to happen
 * before the module graph is built — hence the reset and the dynamic import.
 */
async function loadPeerLoaders(
  replacements: Record<string, Record<string, unknown>> = {},
) {
  vi.resetModules();
  for (const specifier of Object.keys(installedPeers)) {
    const namespace = replacements[specifier] ?? installedPeers[specifier];
    vi.doMock(specifier, () => namespace);
  }
  return await import("./editor-peers");
}

afterEach(() => {
  vi.resetModules();
});

describe("isMissingPeerError", () => {
  it("recognises what each bundler and runtime says for an uninstalled package", () => {
    const messages = [
      // Vite's stub for an optional peer that is not installed.
      'Could not resolve "@tiptap/react" imported by "@tangle-network/ui". Is it installed?',
      // Node ESM.
      "Cannot find package '@tiptap/react' imported from /app/index.js",
      // CommonJS.
      "Cannot find module '@tiptap/react'",
      // webpack.
      "Module not found: Error: Can't resolve '@tiptap/react' in '/app'",
      // esbuild.
      'Failed to resolve entry for package "@tiptap/react"',
    ];

    for (const message of messages) {
      expect(isMissingPeerError(new Error(message)), message).toBe(true);
    }
  });

  it("leaves a transient chunk failure to report its own cause", () => {
    // Enriching this one with "install the peers" sends the reader to the
    // wrong fix, and the peers are already installed.
    expect(
      isMissingPeerError(new Error("Failed to fetch dynamically imported module")),
    ).toBe(false);
    expect(isMissingPeerError(new Error("Network request failed"))).toBe(false);
    expect(isMissingPeerError("Could not resolve")).toBe(false);
  });
});

describe("editor optional peer loaders", () => {
  it("returns the namespaces the editors call", async () => {
    const { loadCollaborationPeers, loadDocumentEditorPeers } = await loadPeerLoaders();

    const documentPeers = await loadDocumentEditorPeers();
    expect(documentPeers.react.useEditor).toBe(installedPeers["@tiptap/react"].useEditor);
    expect(documentPeers.starterKit.default).toBe(
      installedPeers["@tiptap/starter-kit"].default,
    );

    const collaborationPeers = await loadCollaborationPeers();
    expect(collaborationPeers.hocuspocus.HocuspocusProvider).toBe(
      installedPeers["@hocuspocus/provider"].HocuspocusProvider,
    );
    expect(collaborationPeers.yjs.Doc).toBe(installedPeers.yjs.Doc);
  });

  it("names the install list when a peer resolves to a namespace with no editor in it", async () => {
    // A bundler can stub a missing optional peer as a silent empty namespace
    // rather than a throwing module. That shape must still fail with the peers
    // named, and not as an undefined-property crash in the middle of a render.
    const { loadDocumentEditorPeers } = await loadPeerLoaders({
      "@tiptap/starter-kit": { default: undefined },
    });

    await expect(loadDocumentEditorPeers()).rejects.toThrow(
      /Install @tiptap\/react and @tiptap\/starter-kit/,
    );
  });

  it("names the install list when a peer carries the wrong member type", async () => {
    const { loadDocumentEditorPeers } = await loadPeerLoaders({
      "@tiptap/react": { useEditor: undefined, EditorContent: undefined },
    });

    await expect(loadDocumentEditorPeers()).rejects.toThrow(
      /Install @tiptap\/react and @tiptap\/starter-kit/,
    );
  });

  it("keeps the local editor usable when only a collaboration peer is missing", async () => {
    // sandbox-ui installs the tiptap packages alone, so the local markdown
    // editor must not start to require yjs or Hocuspocus.
    const { loadCollaborationPeers, loadDocumentEditorPeers } = await loadPeerLoaders({
      yjs: { Doc: undefined },
    });

    await expect(loadDocumentEditorPeers()).resolves.toBeDefined();
    await expect(loadCollaborationPeers()).rejects.toThrow(
      /@hocuspocus\/provider and yjs/,
    );
  });
});
