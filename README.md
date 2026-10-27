# why — poker with friends

- Viewer: https://koukimatsunaga02.github.io/why-poker-web/
- Editor: https://koukimatsunaga02.github.io/why-poker-web/edit.html

The viewer opens without a key or login. The editor checks the organizer's four-digit password on a separate API. No GitHub token is entered in the normal editor. The PIN is a server secret, not in this repository. Sessions last at most eight hours and live only in the current page's memory. Refreshing requires entering the PIN again.

Records remain public ordinary JSON in `data/records.json`; both URLs use the same file. Anonymous viewers cannot write. The API validates the session and data, uses a fixed repository/path and checks the GitHub blob SHA before saving. A stale write is rejected. Failed writes remain unsaved and retain the input/draft. No browser-only save is presented as shared storage.

## Owner setup (once per GitHub token expiry)

A private owner setup link is delivered separately. Use that link to enter a fine-grained GitHub token scoped to **why-poker-web only, Contents: Read and write**. Do not put the token in source, browser persistent storage or chat. The API encrypts it using AES-256-GCM and a random IV before writing `data/server-access.enc.json` to GitHub. The decryption key exists only in the API's runtime secret configuration. Editor sessions never receive the GitHub credential. The token also has permission to edit repository code, so the initial setup link stays with the owner.

The API Site is `why-poker-api-oct28-matsunaga`. Runtime secret names: EDITOR_PIN, SESSION_SECRET, MASTER_KEY, SETUP_SECRET. Values are not in this repository. Source excerpts are in `server/`; the full framework source is managed in the Sites source repository. Data remains in GitHub rather than an external database.

The API must be publicly reachable for the GitHub Pages frontend; password/session checks protect writes. An API in owner-private mode cannot serve the normal frontend. Initial public access and GitHub credential setup must complete before shared editing is considered operational.

## October sample

See IMPORT-NOTES.md for source, alias handling and estimated dates. Day10 is October 27 and Day9 October 26, 2026. Earlier dates are placeholders and are labeled 仮日付. Source totals and denomination counts are preserved without adding inferred bonuses.

## Operations

Refresh in the shared panel to retrieve updates from another screen. Back up/import JSON from the editor after unlocking. Git history also retains earlier versions. Deleted members can be restored, and archived seasons remain editable independently of the current season.

Low-frequency organizer updates are intended; this is not a real-time game database. Plain records are public, and noindex is not access control. GitHub API limits/outages may interrupt access. Data cap: 600 KB; avatar cap: 250 KB.

## Development

Static assets in the repository root need no build step. Update their content-hash query versions in both HTML files when editing them.

```sh
node --test tests/storage.test.cjs
python3 -m http.server 4176
```

Server tests are supplied with the API source. Validation includes Unicode data, expired PIN sessions, viewer write rejection, concurrent changes, known October totals and dates, archived-season independence and reversible member deletion.
