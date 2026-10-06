/**
 * Shared handling for optional peers that an entry reaches through a dynamic
 * `import()`: `./editor` for tiptap, yjs and Hocuspocus, `./files` for
 * pdfjs-dist. `scripts/validate-dist.mjs` holds the rules these helpers serve.
 */

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
export function rethrow(error: unknown): never {
  throw error;
}
