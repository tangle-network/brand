import { type ComponentType, lazy, type LazyExoticComponent } from "react";
import { isMissingEditorPeersError } from "./editor-peers";

/**
 * Builds a `lazy` editor component that a remount can re-attempt.
 *
 * `lazy` caches its first rejection for the life of the component. That is
 * right for a missing peer, which stays missing for the session, and wrong for
 * a transient chunk fetch: one failed network request would otherwise hold the
 * editor broken until a full page reload.
 *
 * The returned function gives the component to render, and a caller must call
 * it on every render: a transient failure replaces the component, and a caller
 * that holds the one it got earlier keeps replaying the cached rejection.
 *
 * A `MissingEditorPeersError` keeps the cached rejection, so the install list
 * reaches the consumer's error boundary once and the loader does not run
 * again. Any other rejection replaces the component, so the next mount — an
 * error boundary that resets, or a remount by the parent — starts a fresh
 * attempt.
 */
export function retryableLazyEditor<P extends object>(
  loadComponent: () => Promise<ComponentType<P>>,
): () => LazyExoticComponent<ComponentType<P>> {
  function build(): LazyExoticComponent<ComponentType<P>> {
    return lazy(async () => {
      try {
        return { default: await loadComponent() };
      } catch (error) {
        if (!isMissingEditorPeersError(error)) {
          current = build();
        }
        throw error;
      }
    });
  }

  let current = build();
  return () => current;
}
