#!/usr/bin/env bash
# Encrypt before upload; plaintext exists only in RAM-backed /dev/shm.
set -Eeuo pipefail
umask 077
mode=""
if [ "$#" -ge 1 ]; then mode="$1"; fi
case "$mode" in --smoke|--production) ;; *)
 echo "Usage: $0 --smoke|--production" >&2; exit 2;;
esac
config="$HOME/.config/aurora-backup"
identity="$config/identity.agekey"
recipient_file="$config/recipient.txt"
remote_file="$config/remote-name"
folder_file="$config/folder-id"
archive_root="$HOME/.local/share/aurora-backups/encrypted"
age_bin="$HOME/.local/bin/age"
rclone_bin="rclone"

for file in "$identity" "$recipient_file" "$remote_file" "$folder_file"; do
 test -s "$file" || { echo "Missing backup configuration" >&2; exit 3; }
done
test "$(stat -c %a "$identity")" = 600 || {
 echo "Private key must have chmod 600 permissions" >&2; exit 3;
}
[[ "$(stat -f -c %T /dev/shm)" == tmpfs ]] || {
 echo "Refusing plaintext export to persistent storage" >&2; exit 3;
}
IFS= read -r recipient < "$recipient_file"
IFS= read -r remote < "$remote_file"
IFS= read -r folder_id < "$folder_file"
[[ "$recipient" =~ ^age1[a-z0-9]{25,}$ ]] || { echo "Invalid public recipient" >&2; exit 3; }
[[ "$remote" =~ ^[A-Za-z0-9_-]+$ ]] || { echo "Invalid remote" >&2; exit 3; }
[[ "$folder_id" =~ ^[A-Za-z0-9_-]{15,}$ ]] || { echo "Invalid folder" >&2; exit 3; }

if [[ "$mode" == --production ]]; then
 test -f "$config/production-enabled" || {
  echo "Production backup locked: first save recovery key offline and approve." >&2; exit 4;
 }
 [[ "$(cat "$config/production-enabled")" == OWNER_APPROVED_ENCRYPTED_BACKUP ]] || {
  echo "Production backup not approved." >&2; exit 4;
 }
fi

command -v "$age_bin" >/dev/null
command -v "$rclone_bin" >/dev/null
temporary="$(mktemp -d /dev/shm/aurora-backup.XXXXXXXX)"
cleanup(){ rm -rf -- "$temporary"; }
trap cleanup EXIT
trap 'echo "AURORA backup failed; not declaring success" >&2' ERR
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"

if [[ "$mode" == --smoke ]]; then
 filename="AURORA-SYNTHETIC-$timestamp.sql.age"
 printf '%s\n' '-- Fictional data, no accounts or people' \
  'CREATE TABLE smoke(id INTEGER PRIMARY KEY, text TEXT);' \
  "INSERT INTO smoke VALUES (1,'AURORA synthetic test');" > "$temporary/export.sql"
else
 filename="AURORA-D1-$timestamp.sql.age"
 echo "Exporting current production D1 into memory; may briefly block D1 requests."
 npx --yes wrangler@4.157.0 d1 export aurora-uap-production \
  --remote --skip-confirmation --output "$temporary/export.sql" \
  > "$temporary/wrangler.stdout" 2> "$temporary/wrangler.stderr" || {
    echo "D1 export failed; no upload attempted." >&2; exit 5;
  }
 test -s "$temporary/export.sql" || { echo "Empty SQL export" >&2; exit 5; }
fi

echo "Encrypting before Google Drive upload..."
"$age_bin" -r "$recipient" -o "$temporary/archive.age" "$temporary/export.sql"
test -s "$temporary/archive.age"
"$rclone_bin" copyto "$temporary/archive.age" "$remote:$filename" \
 --drive-root-folder-id "$folder_id" --immutable \
 --transfers 1 --checkers 1 --retries 2 --low-level-retries 2
echo "Verifying download and decrypting only in RAM..."
"$rclone_bin" copyto "$remote:$filename" "$temporary/download.age" \
 --drive-root-folder-id "$folder_id" --retries 2 --low-level-retries 2
cmp --silent "$temporary/archive.age" "$temporary/download.age" || {
 echo "Ciphertext mismatch" >&2; exit 6;
}
"$age_bin" -d -i "$identity" -o "$temporary/restored.sql" "$temporary/download.age"
cmp --silent "$temporary/export.sql" "$temporary/restored.sql" || {
 echo "Restore mismatch" >&2; exit 6;
}
if [[ "$mode" == --smoke ]];then
 "$rclone_bin" deletefile "$remote:$filename" --drive-root-folder-id "$folder_id"
 echo "PASS: synthetic encrypted upload/download/restore; test object removed."
else
 install -d -m 700 "$archive_root"
 install -m 600 "$temporary/archive.age" "$archive_root/$filename"
 echo "PASS: encrypted D1 backup verified in Drive and locally: $filename"
 echo "No remote or local retention deletions performed."
fi
