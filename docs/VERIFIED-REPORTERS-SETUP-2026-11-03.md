# AURORA UAP — free reports behind verified email (staged, NOT LIVE)

Owner decision 3 Nov 2026: all reading is free, public submission is free but requires verified email via Google, Apple, X (with separate email proof where needed), or email magic link/OTP. Donations remain optional and never unlock reports. No donor email/payment table is read by this flow.

## Staged architecture

- **Supabase Auth** handles email links and social OAuth (Google, Apple, X). This is separate from the existing owner-only Cloudflare Access moderation app; NEVER set the moderator Access policy to Everyone.
- A local, pinned auth SDK bundle runs only when the intake API reports `accepting:true`; no project keys are hardcoded into source.
- The Pages server calls the Supabase Auth **/auth/v1/user** endpoint with a supplied bearer access token on every POST. A valid, confirmed email is mandatory. Unsigned, expired, unconfirmed or provider-only claims are rejected. The client's UI state is never sufficient authorization.
- The new D1 table `intake_reporter_links` associates the internal provider UUID with a quarantined receipt. It contains **no email or payment information**. The D1 intake table also remains email-free; donor details stay out of both.
- Same-origin, Turnstile, existing D1/migration, privacy review, WAF, private moderation and no-automatic-publication gates remain required.
- Apple Hide My Email relay addresses are accepted; **do not** ban `@private.icloud.com` or `@privaterelay.appleid.com`. Email verification proves control of an address, **not** that a report or a person's offline identity is genuine.
- This is *pseudonymous/publicly anonymous* reporting, **not** a promise of complete anonymity against service providers, court orders, network operators or lawful requests.

## External account setup (not automatable from GitHub alone)

1. Create a dedicated Supabase project for AURORA public Auth. Do not use Cloudflare Access moderator identity for visitors. Configure the Site URL `https://aurorauap.org`, allowed redirect URL `https://aurorauap.org/report.html`, and confirm-email requirements. Enable abuse-rate limits/CAPTCHA in Supabase as appropriate. Configure and test email delivery, including Apple relay.
2. In Supabase Auth → Providers, configure Google OAuth with registered client ID/secret and approved callback URL. Apple requires an Apple Developer team and Services ID; confirm the current Apple service terms and private relay requirements. X OAuth requires an X developer app; request email and **do not** assume X confirms it. Optional email OTP/magic link should be supported with verified email.
3. Once actually tested, configure production Cloudflare Pages variables (public client credentials, **not** service-role secrets): `AURORA_REPORT_AUTH_URL=https://<project>.supabase.co`, `AURORA_REPORT_AUTH_PUBLISHABLE_KEY=<publishable-or-anon-key>`, `AURORA_REPORT_AUTH_PROVIDERS=email,google,apple,x` **only for providers actually active**, `AURORA_REPORT_AUTH_ENABLED=enabled`. Never store a Supabase service_role/secret key in browser code, Pages client settings or repository.
4. With authorized Cloudflare D1 identity and backup/restore checked, apply `migrations/0005_reporter_ownership.sql` **once** to the same production D1 as prior intake migrations. Read-only schema check must find all three tables: `intake_submissions`, `intake_review_events`, `intake_reporter_links`. Do not redo existing migrations.
5. The privacy notice **must be reviewed again** for Supabase account data, provider transfers, emails, rights/deletion and security, and the private deletion procedure must unlink submissions on authorized erasure. Validate terms, lawful bases, provider agreements, audit retention, abuse reporting and any age requirements.
6. Configure and verify production Turnstile, WAF, Pages Fail-Closed, Cloudflare Access moderator allowlist and private queue. The existing form defaults to local drafts until **all** production enable flags are set. Finish the checklist in `docs/INTAKE-RELEASE-CHECK-2026-11-03.md`.
7. Only after all verifications, intentionally enable `AURORA_INTAKE_ENABLED=enabled`, deploy, confirm `/api/intake/status` reports `auth_required:true`, then run a fictional, non-sensitive test with a real verified account (including Apple private relay and an X account lacking verified email) and check DB ownership/audit without public publication. Repeat the test with no token, invalid token, unverified email and wrong-user duplicate request key. Confirm no email/payment appears in public APIs.

## Privacy and retention considerations

Supabase holds the account email and OAuth identities. Cloudflare D1 stores only the opaque provider UUID associated with a private report, so a breach of either dataset is still sensitive. Do not log bearer tokens or Supabase user profiles. Authentication/provider accounts require their own deletion/account recovery process; removing a report alone does not remove the account. Write clear instructions for deleting account data and for orphaned/revoked accounts.

## Test commands

```
npm ci
npm run build:report-auth
node --test tests/privacy-route.test.mjs
node --experimental-sqlite --test tests/intake.test.mjs tests/reporter-auth.test.mjs tests/intake-auth-gate.test.mjs tests/moderation.test.mjs tests/privacy-retention.test.mjs
```

Go-live is **not** authorized by this PR. No free report should become publicly visible without an independent redaction/publication workflow.
