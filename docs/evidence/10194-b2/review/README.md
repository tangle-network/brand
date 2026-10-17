# B2 review corrections

Runtime correction: `c96012527ac348b4a92ef4f8bafc602f29b19b73`; calibrated browser/package source: `189aedf2d76abb778cff0f25bfb3a9a60c9b777c`. Their package runtime inputs are identical.

- The old Sheet class assertion reproduced a failing test (7/8 passed). The corrected group passes8/8; frozen/type/build and all115 affected tests passed.
- The original outline occupied a second grid row at1024/1279px in both renderers. The corrected layout hides it in the two-column range and restores the third column at1280px.
- Checked-first, checked-middle and unchecked radio groups reproduced containment failures in both renderers. All6 corrected cases plus2 separate-form cases pass.
- The complete calibrated review matrix passes16/16; the existing desktop/phone/light/dark/native layout matrix passes8/8.

[Passing review receipt](after/review-receipt.json) · [Passing layout receipt](layout/receipt.json) · [Original failing browser receipt](before/review-receipt.json) · [Packed export receipt](presentation-package.json)

The original wide-layout classifier also marked four valid sticky layouts as failures. Calibration now compares outline top with max(article top, computed sticky top). The four intermediate placement failures and six original radio failures are independent of that correction. Earlier data remains in the original receipt.

[Matched outline comparison](outline-comparison.jpg) and [temporal samples from both passing review recordings](review-video-contacts.jpg) were inspected. Public receipt numbers are rounded to six decimal places.

| Width | React before | React after | Hono before | Hono after |
|---|---|---|---|---|
|1024px|[Before](before/outline-react-1024.png)|[After](after/outline-react-1024.png)|[Before](before/outline-hono-1024.png)|[After](after/outline-hono-1024.png)|
|1279px|[Before](before/outline-react-1279.png)|[After](after/outline-react-1279.png)|[Before](before/outline-hono-1279.png)|[After](after/outline-hono-1279.png)|
|1280px|[Before](before/outline-react-1280.png)|[After](after/outline-react-1280.png)|[Before](before/outline-hono-1280.png)|[After](after/outline-hono-1280.png)|
|1440px|[Before](before/outline-react-1440.png)|[After](after/outline-react-1440.png)|[Before](before/outline-hono-1440.png)|[After](after/outline-hono-1440.png)|

Passing uncut review recordings:

- [react outline/radio journey](after/videos/page@b470376cc9000f9c6f1d8287e9c1c016.webm)
- [hono outline/radio journey](after/videos/page@b06b4f9526e7d5a80f2187fc9c5178c0.webm)
