# Decisions and Guardrails

- Intake defaults to disabled; fail closed unless all independent gates and schema are present.
- Public research registry and private user intake are independent systems and flags.
- User submissions remain private and quarantined; moderator approval never automatically publishes.
- No receipt-ID lookup endpoint unless anti-enumeration/privacy design is reviewed.
- Do not collect email, name, precise GPS, or media in current text-only intake.
- User free text may nevertheless contain personal/sensitive information and must be protected accordingly.
- Production database, Access, Turnstile, WAF and legal readiness are claims only after direct verification.
- No paid feature, destructive database operation, irreversible migration, legal approval, publication of real reports, or third-party transfer without required owner approval.
- Keep the current stack and staged registry; no replacement without demonstrated need.
