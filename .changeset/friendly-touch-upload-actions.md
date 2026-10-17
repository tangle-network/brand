---
"@tangle-network/ui": patch
---

Give Button, Input and SelectTrigger a shared 44px minimum in both dimensions on coarse primary pointers, including compact density. Icon buttons keep a square 44px touch target. Fine-pointer sizes and the existing field text floor are unchanged.

Name UploadProgress retry and remove actions after their file, and render them with the shared ghost icon Button for consistent focus and hit areas. Actions remain non-submitting buttons; retry is available only for failed files.
