---
"@tangle-network/ui": minor
---

Add `ComplianceBadge`, the single compliance claim every public surface renders. It defaults to `status="ready"` ("HIPAA-Ready", outlined); HIPAA's `status="compliant"` ("HIPAA Compliant", filled) is reserved for after the documented launch gate closes per compliance/policies/hipaa-security-program.md. `product="soc2"` consolidates the website's bespoke badge: SOC 2 Type II is an attained audit (compliance/evidence/2026-09-01-final-audit), so its `status="compliant"` copy "SOC 2 Type II" is legitimate to render today, with plain "SOC 2" as the ready form.
