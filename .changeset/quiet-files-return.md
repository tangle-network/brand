---
"@tangle-network/ui": patch
---

Keep file-tree selection callbacks current after rerenders and synchronize controlled selection through the native item API.
Closing a file clears its selection so the same file can be opened again.
