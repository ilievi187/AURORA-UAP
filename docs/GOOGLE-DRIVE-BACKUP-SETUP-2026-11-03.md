> **LATEST UPDATE 4 NOV 2026 21:09 EET:** The owner repaired the noninteractive Cloudflare API credential, and a real production D1 export succeeded, followed by age encryption, private Google Drive upload, downloaded decryption check and mode-0600 local copy. Service result=success/exit 0; next unattended timer run scheduled for 5 Nov at about 04:16 EET. Historical notes below describe earlier setup. Wrangler D1 export required D1 Edit, a broader permission than Read; protect and audit this token.

> **UPDATE 4 NOV 2026:** The scheduled D1 backup service is enabled but the latest run **FAILED** because noninteractive Wrangler requires a scoped Cloudflare API token. An encrypted historical Drive/local archive exists, but do NOT claim fresh daily backups are working. One-time secure token enrollment is needed; see docs/BACKUP-UNATTENDED-CLOUDFLARE-AUTH-2026-11-04.md.

# AURORA encrypted Google Drive backup — operator setup

**State after setup (3 November 2026):**
- Google Drive folder `AURORA-UAP-BACKUPS` created under the connected owner's My Drive. Google permissions show **owner only**, not shared.
- The existing `gdrive-private` rclone remote on NightKnightPC has been reauthorized through the owner's browser and can list the target folder.
- Official age v1.3.1 binaries installed locally on NightKnightPC as `~/.local/bin/age` and `age-keygen`.
- New dedicated age keypair generated under `~/.config/aurora-backup/`; identity stored with mode 0600, directory 0700. **The identity/secret itself is not uploaded and is never committed.**
- The local `~/.local/bin/aurora-d1-backup` command has been installed from `scripts/backup-d1-drive.sh`.
- A real encrypted dummy-only roundtrip succeeded: encrypt synthetic SQL in /dev/shm, upload to private Drive folder, download, decrypt and compare exact bytes, then delete only that dummy object.
- User-level systemd timer and service are staged, but the timer is **disabled**. No real D1 snapshot was yet uploaded. No automation can execute production backups until the owner saves a recovery key outside NightKnightPC and creates the explicit local approval marker.

## Recovery key — required owner action BEFORE production backups

1. On NightKnightPC, open a terminal you control and run:
   `cat ~/.config/aurora-backup/identity.agekey`
2. Copy the complete private identity into a reputable password manager **or a separate encrypted USB drive**. Do not store the only copy on NightKnightPC. Do not send this secret in chat, attach it to GitHub, put it in Google Drive, or show it in screenshots. Anyone with this key and a backup can decrypt all report data.
3. Verify the off-device copy opens correctly. Protect access to it with strong authentication.
4. Tell the operator the recovery key has been saved safely, **not the key itself**.

## Then authorize production backup (manual owner action)

Once the offline recovery key is confirmed:
```bash
umask 077
printf 'OWNER_APPROVED_ENCRYPTED_BACKUP\n' > ~/.config/aurora-backup/production-enabled
chmod 600 ~/.config/aurora-backup/production-enabled
~/.local/bin/aurora-d1-backup --production
```

The production command exports a current D1 snapshot to a RAM-backed `/dev/shm` directory (it **can briefly block D1 traffic**), encrypts with the age public recipient before network transfer, uploads only `.age` ciphertext, downloads it, decrypts temporarily in RAM and byte-compares the restored SQL, then retains an encrypted local copy. All temporary plaintext is removed upon command exit. No deletion or automatic rotation occurs.

Only after the first real encrypted export and isolated restore have passed and the owner has confirmed retention requirements:
```bash
systemctl --user enable --now aurora-d1-backup.timer
systemctl --user list-timers --all | grep aurora-d1-backup
```

The timer is configured for **04:10 local time** with up to 10 min randomized delay and `Persistent=true` (missed runs execute when the user session next starts). NightKnightPC must be powered on and the user's systemd manager active. Monitor logs via:
```bash
journalctl --user -u aurora-d1-backup.service -n 40 --no-pager
```

## Privacy and retention constraints

- The Google Drive copy is encrypted at rest **before upload**; Google's account authorization does not replace age encryption.
- The local identity is not enough to recover backups if NightKnightPC is destroyed; verify an off-device copy first.
- The existing old SQL backup predates migration 0005. Once approved, create an up-to-date encrypted export before claiming the backup is operational.
- Restoring an earlier snapshot may resurrect already erased personal data. Reconcile rights erasures in a separate protected record before bringing any restored DB online.
- **Do not automatically delete old backups** until controller/privacy approval of backup retention and the erasure reconciliation policy. Set 7 daily/4 weekly rotation only after that approval.
- Never run `wrangler d1 time-travel restore` or decrypt private D1 data directly on public hosts during a rehearsal. Never put plaintext D1 exports in ordinary disk-based /tmp or the repository.
- Keep `AURORA_INTAKE_ENABLED` disabled until all public intake approvals (WAF, privacy, retention, live protected Turnstile) are complete.

Safe test:
```bash
~/.local/bin/aurora-d1-backup --smoke
node --test tests/backup-drive.test.mjs tests/backup-recovery.test.mjs
```

No GDrive folder ID, rclone access token or age recovery private key is committed in the GitHub repository.
