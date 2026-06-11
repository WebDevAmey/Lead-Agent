# Shopify Solo Founder Finder

Finds and ranks US Shopify stores likely run by a single person — high-intent leads where the founder reads their own email.

## Why solo-detection is the hard part

Anyone can check if a store accepts USD. The hard part is distinguishing a solo maker from a small team. We use **pronoun ratio** as the core signal: a page written in "I/my/me" voice is statistically very different from one written in "we/our/us". Combined with maker vocabulary, founder name detection, and the absence of a team page, this gives a transparent, tunable score.

## 5-Step Build

1. **DB** (`lib/db.js`) — SQLite via built-in `node:sqlite`. Schema + idempotent upsert.
2. **HTTP** (`lib/http.js`) — fetch wrapper with 12s timeout, browser UA, exponential backoff on 429/403.
3. **Shopify check** (`lib/shopify.js`) — `/products.json` must return a products array. Also reads `/meta.json` for currency.
4. **Scrape** (`lib/scrape.js`) — visits about/story/team pages, harvests pronouns, maker words, email, founder name, US address/phone.
5. **Score** (`lib/score.js`) — three transparent functions: `scoreUS`, `scoreSolo`, `finalScore`. Every score carries a plain-English reason.

## How to Run

```bash
node --version        # must be >= 22.5.0
npm install
npm test              # runs scoring logic tests, no network needed
npm start             # processes input.txt, writes leads.db + leads.csv
npm start my_list.txt # use a custom input file
```

## Reading the CSV

Work top-down. **score >= 70** is a strong match. Key columns:

| Column | Meaning |
|---|---|
| `score` | 0–100. Sort descending. |
| `solo_reason` | Why the solo score is what it is. |
| `us_reason` | Why the US score is what it is. |
| `founder_name` | Extracted from JSON-LD or page text. |
| `email` | Contact email found on the page. |
| `status` | `done` / `not_shopify` / `needs_domain` |

## Instagram Domain-Guess Caveat

When you provide an `@handle`, the tool guesses `handle.com`. This works ~60% of the time. If status is `needs_domain`, manually find the real domain and add it to `input.txt` — re-runs skip already-done rows.

## Score Weight Tuning

Edit `lib/score.js`. Key levers:
- `scoreUS`: raise the `>= 18` threshold to require more US signals
- `scoreSolo`: adjust the ratio thresholds (0.6 / 0.4) or maker word cap (14 pts)
- `finalScore`: change the product count brackets

## Scaling to a Team / Supabase

The `leads` table maps 1:1 to a Postgres table. When a teammate needs the live list, spin up Supabase, `CREATE TABLE leads (...)` with the same columns, and swap `DatabaseSync` for `pg`. Until then, SQLite is faster and needs zero infra.