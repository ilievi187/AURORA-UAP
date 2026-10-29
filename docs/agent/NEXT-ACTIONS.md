# Next Actions — read first when resuming

Updated 2026-10-29 18:28 UTC.

Atlas UX status: draft PR #35 is open; all 10 GitHub checks passed and the branch preview was checked. Preview D1 stats return HTTP 503 because binding `DB` is not configured; the UI preserves the 15-case sourced archive and shows registry completeness unknown. No cases or coordinates were added. Keep PR #35 and issue #32 open while broader source expansion remains incomplete.

1. Before the next mission slice, re-read issue #32 and current PR/workflow state, including PRs #33, #34 and #35; do not assume their state from this note.
2. Continue news-reliability diagnosis with authorized Cloudflare runtime/cache logs. Do not invent or seed headlines. If Cache API research is needed, use the user-authorized Gemini browser route; do not use a Gemini API.
3. Continue the inline-video slice only for supported/licensed sources; no bulk download or rehosting of copyrighted third-party media.
4. Expand allowed RSS/API sources with attribution, deduplication, locale coverage and rate limits; preserve source terms and distinguish allegations from established facts.
5. Broaden the sourced global archive only with authentic, attributable cases and defensible locations; never invent case data, media or coordinates. Ensure radar, countries and archive remain consistent.
6. Review PR #14 (`feat/secure-moderation`, draft, head `b089eb254ecb714df39bcd89653e6db01452aabf`) before merge. Re-run review/checks and recheck `docs/V1.8-MODERATION-SETUP.md`; do not mark production-ready.
7. Production D1, Turnstile, WAF, privacy/retention and moderation gates remain blocked until directly verified and owner-approved. No production writes/deployment based solely on local tests or preview checks.

Resume policy: do not rely on prior chat context. Re-fetch remote state and consult this file, `CURRENT-STATE.md`, `ACTIVE-TASK.md`, and `BLOCKERS.md` first.
