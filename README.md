# why — poker with friends

Texas Hold’em results for a small private circle. Black widget UI, IBM Plex Sans, neon why logo. Responsive desktop/mobile. Tap, drag, or use arrow/Home/End keys on the home chart to inspect end-of-day balances. Multiple adjustments on one day are represented by that day's last recorded balance.

## Hosting and data

- GitHub Pages serves the static files in the repository root from `main`.
- `data/vault.json` is **AES-256-GCM encrypted JSON**, using a random 256-bit viewer key, random 96-bit IV for every save, a 128-bit authentication tag, and versioned additional authenticated data.
- The public repository contains no plaintext player records, viewer keys, or GitHub tokens. Anyone can download the ciphertext; only key holders can decrypt it. The code, update time, and encrypted file size are public.
- The owner enters a fine-grained GitHub token for **this repository only**, with **Contents: Read and write**, in the app's connection panel. The token is sent only to `api.github.com` using an Authorization header and lives in memory until reload/lock. Do not give it to viewers. It can also edit the repository's application code; keep it under the owner's control.
- Viewer keys also live only in memory. Give friends the site URL and viewer key separately. No key in query strings, fragments, localStorage, source, or Git history.
- Updates use GitHub Contents API with a blob SHA compare-and-swap. Stale writes are rejected rather than merged or silently overwritten. Failed submissions remain in the form/in-memory draft, with a JSON export option. No local-only fallback is reported as saved.
- Refresh in the connection panel to see another organizer's changes. Reloading requires entering the viewer key and, for editing, the token again.

This is a low-frequency, single-organizer solution, not a SQL database. API rate limits, token expiry and GitHub outages can interrupt access. Plaintext is limited to 600 KB so the Base64 encrypted file stays within Contents API limits; use small avatar images. Back up encrypted JSON and the key separately. Loss of the key means loss of access to the corresponding encrypted records. Git commit history preserves older encrypted states. A viewer key shared with someone cannot revoke access to old downloaded copies. To recover a previous state, download that commit's `data/vault.json`, import it with the matching viewer key, review the counts, and save it as a new commit.

## Initial setup and migration

The deployed initial vault has **no players or match results**, with one zero-base season. This avoids treating prototype samples as real results.

1. Open the site and enter the viewer key supplied separately. Keep that key in a password manager or offline backup.
2. In `共有・接続`, open GitHub's fine-grained token page. Select the owner account, `Only select repositories` → `why-poker-web`, short expiration, `Contents: Read and write`. Generate it yourself; never send the token through chat or commit it.
3. Paste the token into the app's password field. It is used only for this open page.
4. On the device/browser with the real prototype data, use `記録` → `データを書き出す` to export JSON.
5. On the new site, use `共有・接続` → JSON import, review member/season/record counts, then save. All prototype seasons and denomination counts are retained. Existing GitHub content remains in commit history.
6. Verify from another browser with only the viewer key. Share the site URL and viewer key directly with friends; the token stays with the organizer.

## Development and verification

No build step or external JS dependencies. `index.html`, `style.css`, `config.js`, `vault.js`, `connection.js`, `app.js` are deployed directly. Tests live in `tests/`.

```sh
node --test tests/storage.test.cjs
python3 -m http.server 4176
```

Tests cover authenticated encryption, invalid schema, rejected writes, optimistic concurrency, daily history, season isolation, and reversible member deletion. Test data/keys never belong in the production vault.

The original private `why-poker` repository remains the prototype source archive. Production lives in `why-poker-web`.
