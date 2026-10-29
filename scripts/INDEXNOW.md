# IndexNow operation

Set `INDEXNOW_KEY` in the existing Render service environment to a cryptographically
random key (for example, 32 random bytes encoded as hex). Do not commit its value.
`/indexnow-key.txt` returns 404 without a valid key and serves it as plain text with
`X-Robots-Tag: noindex` once configured. The verification file must be publicly
readable for search engines; it is not an application credential.

After the release is live, pass only canonical URLs affected by that release:

```sh
node scripts/indexnow.mjs --dry-run https://enetcomproject.com/veritabani.html
node scripts/indexnow.mjs https://enetcomproject.com/veritabani.html
```

The submission command needs the same `INDEXNOW_KEY` in its process environment.
Do not put it in a command argument or log it. The tool verifies the live key file,
requires direct HTTP 200 pages, allows only known public content pages and EN/DE
language parameters, and deduplicates by URL and live HTML hash.

State defaults to `.cache/indexnow-state.json` (excluded from Git). For repeated
operations, preserve this file or set `INDEXNOW_STATE_PATH` to a durable private
path. A fresh/ephemeral checkout has no deduplication history. Do not run automatic
submissions on every Render restart. No scheduled job or new paid service is needed.
HTTP 200 means received; HTTP 202 means received with key validation pending.
Neither result proves indexing. Failed requests do not advance submission state.
