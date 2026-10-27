# why — poker with friends

Responsive poker results tracker for a small friend group. Black widget UI, IBM Plex Sans, pink why logo. Home chart supports tap/drag and arrow/Home/End keys to inspect recorded daily balances.

- **Viewer:** https://koukimatsunaga02.github.io/why-poker-web/
- **Editor:** https://koukimatsunaga02.github.io/why-poker-web/edit.html

The viewer opens automatically with no login or viewer key. It shows rankings, members, chip balances, events and graphs. Editing controls and token entry are absent. Both URLs use the same `data/records.json` in this public repository. Records are ordinary JSON, not encrypted. Anyone can read the data; do not put private information in it. `noindex` is a search-engine hint, not access control.

The editor requires the owner's fine-grained GitHub token only for saving. Scope it to **why-poker-web only**, **Contents: Read and write**, with a short expiry. The token can also modify this repository's application code; keep it with the owner. Enter it in the editor's `編集・共有` panel. Tokens live in memory, are sent only to `api.github.com`, and are never written to source, browser persistent storage, or data files. Reloading clears the token. The editor URL alone does not grant GitHub write permission. The storage client also rejects writes from viewer mode.

GitHub Pages serves `main` from the repository root with HTTPS. No custom domain or server. Writes use the Contents API with a blob SHA, reject stale writers, and preserve prior states in Git history. Refresh from `共有・更新` to see another screen's changes. Failed writes retain the input/draft and offer JSON export. This is intended for low-frequency organizer updates, not real-time play. Data limit: 600 KB; avatars: 250 KB each. GitHub API limits and outages can interrupt reads/writes.

## Start / migrate

1. Open the viewer URL directly, or the editor URL for management.
2. In the editor's connection panel, create and enter a fine-grained token scoped as above. Do not send the token through chat.
3. On the device containing the actual old prototype data, export JSON from `記録` → `データを書き出す`.
4. In the editor, import that JSON, review member/season/record counts, then save to GitHub.
5. Verify the result from the viewer URL in another browser.

The initial shared data is empty: one season, no members/results. Prototype samples were not treated as real results. Existing denomination counts, bonuses and seasons are retained on import. Archived seasons stay editable; member deletion is reversible.

Back up from `編集・共有` → JSON backup. To restore, import a previous backup and review before saving. You can also retrieve an older `data/records.json` from Git history. Legacy encrypted backups can be imported with their old key; opening the current site never needs that key. The old `data/vault.json` is a retired encrypted snapshot, retained for recovery only.

## Development

No build step. Static assets have content-hash query versions in both HTML entry points; update those hashes when changing assets.

```sh
node --test tests/storage.test.cjs
python3 -m http.server 4176
```

Tests cover data validation, Unicode serialization, API rejection, concurrent updates, viewer write rejection, daily chart snapshots, archived-season isolation and member restore. Legacy decryption is tested for import compatibility. Real owner-token setup and migration remain user steps.
