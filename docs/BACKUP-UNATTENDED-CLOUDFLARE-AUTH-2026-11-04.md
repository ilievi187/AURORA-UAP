> **LATEST RESULT — 4 NOV 2026, 21:09 EET:** Owner-approved real production backup via the systemd service completed successfully after the owner installed an account-scoped Cloudflare token with D1 Edit and the correct Account ID. D1 export, age encryption, private Google Drive upload, download/decryption verification and mode-0600 local copy all passed. Daily timer remains enabled/active; the next scheduled run is pending. Historical incident notes below describe the previous failure.

# AURORA — unattended Cloudflare D1 backup credential setup

**Operator action still required as of 4 November 2026.** Do not declare that daily encrypted exports are working until the exact production job completes successfully and an actual encrypted Drive copy is verified.

## Live failure observed

NightKnightPC user timer is enabled and active, but the service last ran on 4 November and FAILED with exit code 5 (D1 export failed). The last existing local encrypted archive predates that run. Read-only investigation of the same Wrangler D1 list from a noninteractive terminal produced:

In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable for wrangler to work.

The issue is unattended API authentication, not proven database corruption. The service previously relied on an interactive browser Wrangler login, which is not reliable for systemd background jobs.

## Secure solution implemented in the repository

- The user systemd unit uses LoadCredential by credential NAME ONLY; it searches the current user's private systemd credential store and exposes a read-only credential copy under CREDENTIALS_DIRECTORY.
- The production backup script requires a correctly formatted token, then passes it only as the CLOUDFLARE_API_TOKEN environment for the single Wrangler D1 export subprocess. It does not pass the token to age, rclone, or terminal output.
- The Cloudflare account ID credential is optional; supply it if Wrangler cannot identify the one correct account automatically.
- Missing token returns a clear exit code 7 before any D1 network call or upload. World-readable local token files are rejected. An invalid account ID returns exit code 8.
- The backup retains its existing controls: explicit owner approval, plaintext only on RAM-backed /dev/shm, age encryption before upload, immutable Drive copy, encrypted local copy and verified download/decryption.
- The CLI token is never copied into source control, GitHub Actions, Pages environment variables or chat. The unit has no embedded secret.
- These controls are verified by synthetic local tests, not by reading any real token. There is NO automatic fallback to stored browser OAuth credentials.

## One-time owner action on NightKnightPC

1. In Cloudflare dashboard, create an API token restricted to the correct AURORA account, ideally with minimum Account > D1 Read permission. The token must support the actual D1 export endpoint; if Cloudflare denies that operation, inspect the reason before considering any extra scope. Do not grant unnecessary Pages, DNS, D1 Write or account administrator permissions.
2. Open a terminal **locally** on NightKnightPC, in your own session. Run the installed helper:

       ~/.local/bin/aurora-cloudflare-token-setup

   The helper requires a real TTY, hides token entry, verifies basic format and stores it as a 0600 credential in ~/.config/credstore/aurora_cloudflare_token. It also prompts for an optional 32-hex Cloudflare Account ID (this is not the token).
3. Do NOT paste the token into ChatGPT, screenshots, GitHub, logs, scripts or emails. Do not use the browser's temporary OAuth credential as a replacement for the scoped long-running API token.
4. Once the token is stored, check that NightKnightPC has internet, then run:

       systemctl --user daemon-reload
       systemctl --user reset-failed aurora-d1-backup.service
       systemctl --user start aurora-d1-backup.service
       systemctl --user show aurora-d1-backup.service -p Result -p ExecMainStatus
       journalctl --user -u aurora-d1-backup.service -n 25 --no-pager

   A successful, owner-approved real production export may briefly block D1 queries, so use an appropriate window. The script never prints the API token; do not post private terminal logs unredacted.
5. Confirm a new encrypted .age file exists locally and in the private Drive destination, with a byte-for-byte verified download and decryption to RAM. Only then declare automated backup recovered. Check the next timer execution after 04:10 local time.
6. If the job fails, do not claim backup success. Retain the previous encrypted archive, check the error class privately, and rotate/revoke the token if exposed. The daily timer can stay enabled but will continue failing until authentication is configured.

## Validation without real user data

    node --test tests/backup-drive.test.mjs tests/backup-recovery.test.mjs tests/privacy-restore-guard.test.mjs

These synthetic tests verify invalid/missing token rejection, private credential mode, fake account ID rejection, helper interactivity, backup disabled-until-approved behavior, isolated restore integrity and erasure reconciliation. They do not require Cloudflare or Google credentials.

Official references:
- https://developers.cloudflare.com/workers/wrangler/system-environment-variables/
- https://developers.cloudflare.com/fundamentals/api/reference/permissions/
- https://freedesktop.org/software/systemd/man/latest/systemd.exec.html

**Privacy caveat:** A successful encrypted archive is not evidence of an approved backup retention/deletion period or GDPR compliance. External erasure reconciliation and independent legal review remain mandatory before public intake opens.


## Corrected Cloudflare permission finding

D1 Read permitted viewing the AURORA database but denied Wrangler D1 export with 403 / code 10000. The owner elevated only this account-scoped token to D1 Edit, which subsequently succeeded. D1 Edit is broader than read-only and can authorize DB changes; protect the token locally, audit or rotate it if compromised, and consider a more limited export privilege if Cloudflare supports one later. No token content is in GitHub. The next daily timer run still needs separate observation.

The latest encrypted archive is AURORA-D1-20261104T190946Z.sql.age. The systemd service ended successfully; live prelaunch safety monitor passed 12/12, with no public intake enabled. This does not mean legal retention or privacy rights processes are complete.
