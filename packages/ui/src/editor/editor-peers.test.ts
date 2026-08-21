import { afterEach, describe, expect, it, vi } from "vitest";
import {
  asMissingEditorPeersError,
  isMissingEditorPeersError,
  isMissingPeerError,
} from "./editor-peers";

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

  it("names the install list when an extension stub carries a default it cannot configure", async () => {
    // The commonest stub shape is a default export that is present but empty.
    // It passes a plain "is the default defined" test, and then the factory
    // calls .configure() on it and throws an opaque TypeError mid-render.
    const { loadDocumentEditorPeers } = await loadPeerLoaders({
      "@tiptap/starter-kit": { default: {} },
    });

    await expect(loadDocumentEditorPeers()).rejects.toThrow(
      /Install @tiptap\/react and @tiptap\/starter-kit/,
    );
  });

  it.each([
    "@tiptap/extension-collaboration",
    "@tiptap/extension-collaboration-caret",
  ])("names the collaboration install list when %s is an empty default", async (specifier) => {
    const { loadCollaborationPeers } = await loadPeerLoaders({
      [specifier]: { default: {} },
    });

    await expect(loadCollaborationPeers()).rejects.toThrow(
      /@hocuspocus\/provider and yjs/,
    );
  });

  it("marks a missing peer permanent and leaves any other failure retryable", async () => {
    // editor-lazy.ts reads this distinction to decide whether a remount may
    // try the import again.
    const { loadDocumentEditorPeers } = await loadPeerLoaders({
      "@tiptap/starter-kit": { default: {} },
    });

    await expect(loadDocumentEditorPeers()).rejects.toSatisfy(isMissingEditorPeersError);
    expect(isMissingEditorPeersError(new Error("Failed to fetch dynamically imported module"))).toBe(
      false,
    );
  });

  it("reports an unresolved import as a permanent missing peer and keeps the cause", async () => {
    // The rejection a throwing stub gives must become the install list, so a
    // consumer reads which packages to add, and must count as permanent so a
    // remount does not retry an import that cannot start to succeed.
    const resolutionFailure = new Error('Could not resolve "@tiptap/starter-kit"');
    const mapped = asMissingEditorPeersError(resolutionFailure, "install the peers");

    expect(isMissingEditorPeersError(mapped)).toBe(true);
    expect(mapped).toHaveProperty("cause", resolutionFailure);
    // The install list holds every peer the surface needs, so the message also
    // names the one that is actually absent.
    expect((mapped as Error).message).toBe(
      "install the peers @tiptap/starter-kit did not resolve.",
    );
  });

  it("names the caret package rather than the collaboration package it contains", async () => {
    // "@tiptap/extension-collaboration" is a prefix of the caret specifier, so
    // a naive substring match reports the wrong package.
    const caretFailure = new Error(
      'Could not resolve "@tiptap/extension-collaboration-caret"',
    );
    const mapped = asMissingEditorPeersError(caretFailure, "install the peers");

    expect((mapped as Error).message).toBe(
      "install the peers @tiptap/extension-collaboration-caret did not resolve.",
    );
  });

  it("leaves the install list alone when the failure names no single package", async () => {
    const vague = new Error("Module not found");
    const mapped = asMissingEditorPeersError(vague, "install the peers");

    expect((mapped as Error).message).toBe("install the peers");
  });

  it("leaves a transient chunk failure unchanged, so a remount can retry it", async () => {
    const transient = new Error("Failed to fetch dynamically imported module");

    expect(asMissingEditorPeersError(transient, "install the peers")).toBe(transient);
    expect(isMissingEditorPeersError(transient)).toBe(false);
  });

  it("names the install list when a peer carries the wrong member type", async () => {
    const { loadDocumentEditorPeers } = await loadPeerLoaders({
      "@tiptap/react": { useEditor: undefined, EditorContent: undefined },
    });

    await expect(loadDocumentEditorPeers()).rejects.toThrow(
      /Install @tiptap\/react and @tiptap\/starter-kit/,
    );
  });

  it("accepts the shapes the installed peers really have", async () => {
    // The other cases in this file describe the peers, so nothing here would
    // notice a tiptap release that moves `configure` off the default export.
    // Loading the real packages is what turns that into a failure here rather
    // than in a consumer's editor.
    vi.resetModules();
    for (const specifier of Object.keys(installedPeers)) {
      vi.doUnmock(specifier);
    }
    const { loadCollaborationPeers } = await import("./editor-peers");

    const peers = await loadCollaborationPeers();
    // Prove the substitutions are gone; against the stubs this case would
    // pass without reading a real package at all.
    expect(peers.starterKit.default).not.toBe(installedPeers["@tiptap/starter-kit"].default);
    expect(typeof peers.starterKit.default.configure).toBe("function");
    expect(typeof peers.collaboration.default.configure).toBe("function");
    expect(typeof peers.collaborationCaret.default.configure).toBe("function");
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
