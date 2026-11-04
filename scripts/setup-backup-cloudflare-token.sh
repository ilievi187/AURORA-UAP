#!/usr/bin/env bash
# Run directly in the OWNER'S terminal. Never use through AI chat or CI.
# Only stores the scoped token in the private systemd user credential store.
set -Eeuo pipefail
umask 077
if [[ ! -t 0 || ! -t 1 ]]; then
 echo "This setup requires an interactive owner-controlled terminal." >&2
 exit 2
fi
printf 'AURORA encrypted backup: private Cloudflare D1 Read API token setup.\n'
printf 'Create a token for the AURORA Cloudflare account with the minimum D1 Read scope.\n'
printf 'The token will NOT be echoed, uploaded, logged, or placed in Git.\n'
read -r -s -p 'Paste scoped API token (hidden): ' token
printf '\n'
if [[ ! "$token" =~ ^[A-Za-z0-9._-]{30,}$ ]]; then
 echo "Token format rejected; no credential was stored." >&2; unset token; exit 3
fi
directory="$HOME/.config/credstore"
install -d -m 700 "$directory"
(umask 077; printf '%s' "$token" > "$directory/aurora_cloudflare_token")
chmod 600 "$directory/aurora_cloudflare_token"
unset token
read -r -p 'Cloudflare Account ID (32 hexadecimal characters; Enter to skip): ' account_id
if [[ -n "$account_id" ]]; then
 if [[ ! "$account_id" =~ ^[0-9a-fA-F]{32}$ ]]; then
  echo "Invalid optional account ID; token stored but account ID not saved." >&2; unset account_id; exit 4
 fi
 (umask 077; printf '%s' "$account_id" > "$directory/aurora_cloudflare_account_id")
 chmod 600 "$directory/aurora_cloudflare_account_id"
fi
unset account_id
echo "Private systemd user credential setup complete. No backup has been run."
echo "After checking availability, an operator can run:"
echo "  systemctl --user start aurora-d1-backup.service"
echo "  systemctl --user show aurora-d1-backup.service -p Result -p ExecMainStatus"
