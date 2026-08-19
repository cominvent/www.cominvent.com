# cominvent-contact (Cloudflare Worker)

Server-side endpoint for the website contact form. Receives a JSON POST from the
static site and sends it to `ci@cominvent.com` via the **Brevo** transactional
email API — so the Brevo API key never reaches the browser, and no long-running
server is needed.

Deployed separately from the Hugo site (this directory is ignored by the Hugo build).

## Deploy

```sh
cd contact-worker
npx wrangler login                 # one-time: authorise wrangler with the Cloudflare account
npx wrangler secret put BREVO_API_KEY   # paste the Brevo key (value of repo-root .env BRAVO_API_KEY)
npx wrangler deploy                # prints the Worker URL (…workers.dev)
```

Then set the printed URL as `params.contact_endpoint` in `../hugo.toml` and redeploy the site.

## Config
- **Secret** `BREVO_API_KEY` — set via `wrangler secret put` (never committed).
- **Vars** (`wrangler.toml`): `TO_EMAIL`, `FROM_EMAIL` (Brevo-authenticated sender), `FROM_NAME`,
  `ALLOWED_ORIGINS` (CORS allowlist for the cominvent domains).

## Behaviour
- `OPTIONS` → CORS preflight. `POST` (JSON `{name,email,message,company}`) → validate → Brevo → `{ok:true}`.
- Origin must be in `ALLOWED_ORIGINS`. `company` is a honeypot (bots fill it → silently dropped).
- `replyTo` is set to the visitor, so replying in the inbox goes straight back to them.
