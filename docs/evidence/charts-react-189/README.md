# Packed React chart proof

The fixture installs a Charts tarball outside the workspace and bundles its public React export.
React 18 uses separately installed peers and compiles the packed declarations with React 18 types.
React 19 uses the workspace runtime peer; Charts still resolves from the isolated tarball.

Both runs pass desktop light, desktop dark, and 390px phone cases in Chromium.
They cover cursor proximity, actual-stack selection height, transformed/paint-contained ancestry, keyboard selection and dismissal, emulated touch, viewport containment, readable data tables, and reduced motion.
They report zero browser page errors.
Physical touch hardware, screen-reader audio, and browsers without native popovers remain unchecked.

Open the screenshots in [React 18](react18/) and [React 19](react19/).
The videos directories contain uncut originals; no time is omitted.
Run commands are in the package README.
The initial fixture served stale theme markup after a failed port rebind; those provisional artifacts are preserved outside this delivery receipt.
