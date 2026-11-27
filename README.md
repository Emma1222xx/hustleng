# HustleNG v1.0.0 — controlled beta

Small Tasks. Real Money. Nigeria-first micro-work marketplace. Free joining and zero platform commission in beta. This is a working, server-rendered Node.js + SQLite pilot, **not an automatically paying or public-launch-ready financial service**. No paid listings or fake earnings are seeded. Illustrative task cards are explicitly marked as examples.

## Quick start

Requires Node.js 22.13+ (Node's built-in SQLite module); no npm dependencies.

```sh
cp .env.example .env
# Edit .env: set ADMIN_EMAIL, a unique ADMIN_PASSWORD of at least 14 characters
node --env-file=.env server.mjs
# Open http://localhost:3000
npm test
```

Admin is bootstrapped only if the email is not already registered. Remove ADMIN_PASSWORD from the environment after first boot. A single normal account can act as worker and employer. Never share admin credentials.

## Pilot workflow

1. Register employer and worker accounts.
2. Employer creates a task (category, instructions, proof, reward, slots, deadline).
3. Operator reviews rules and independently verifies full external funding; admin enters a unique verified reference to publish. No payment is taken by the website.
4. Worker claims one slot, completes work and submits original text or URL proof; employer reviews and explains rejections.
5. Worker may appeal; admin resolves. Approved rewards are recorded as amounts owed.
6. Worker requests payout. Operator verifies recipient details securely outside the app, completes payment using an approved method, and records its unique confirmed reference. Do not mark a payment paid from a screenshot alone.

The server enforces authorisation, unique task claims, slot caps in a transaction, valid state transitions, unique funding/payment references, CSRF, hashed passwords, hashed session tokens, secure cookies on HTTPS, basic rate limiting, escaped content, security headers, and an admin action log. Automated tests exercise workflow, claim concurrency, XSS escaping, unauthorised actions, duplicate payout and CSRF. This is not a full penetration test.

## Deployment

Use a persistent Node host or VPS, not GitHub Pages or Netlify static hosting. Dockerfile included. Mount persistent `/app/data`, set `PUBLIC_ORIGIN` to the exact public HTTPS origin, set admin bootstrap variables securely, and configure HTTPS reverse proxy. A single Node instance is intended; don't run multiple replicas with independent database files. Back up SQLite safely (including WAL, using SQLite backup or a consistent snapshot). Don't commit `.env`, database files or real personal data. Health endpoint: `/health`.

Create a new private GitHub repo `hustleng` and upload the contents of this folder. The source contains no real credentials or test user data. Deployment is not included in a GitHub upload.

## Growth features included

Responsive lightweight pages, public task browsing without registration, search/category/reward/time filters, per-task share links and WhatsApp sharing, crawlable server-rendered HTML, robots.txt, sitemap for available tasks, category copy, and no fabricated testimonials or counters. Google JobPosting markup intentionally omitted: microtasks should not be misrepresented as conventional employment. Add accurate structured data only if eligibility is established.

## Before any public launch

- Establish actual operator identity, verified support channel, data retention/deletion procedures, privacy notice and reviewed Nigerian legal/compliance requirements. The included privacy/beta terms are a placeholder for a controlled pilot.
- Add email ownership verification, secure password reset, admin MFA, account recovery, identity and employer verification appropriate to risk, abuse controls, and reliable support. Login rate limits are in-memory and IP-based; configure proxy-aware distributed controls for public deployment.
- Establish a permitted funding and payout model with a regulated provider; verify Nigerian payment and data-protection obligations, reconciliation, refunds, abandoned jobs, employer review time limits, payout failures and disputes. V1 records external payments manually; no live API or bank information collection. Do not market it as an escrow or wallet.
- Add server-side provider integration (e.g. Paystack, subject to approval): verify signed webhooks and transaction amount/currency/reference; use idempotent event handling, unique transfer references, reconciliation and reversal handling. Never trust browser callbacks alone. Keep secrets on the server.
- Add private file proof storage, malware scanning, duplicate proof detection, task expiration and claim-release automation, email alerts, pagination beyond the first 100 listings, accessibility/security/load tests, backups and incident handling. V1 supports text/URL proof and manual operations; dates use UTC.
- Seed genuine business-funded jobs first, then pilot with a limited group. Track task supply, claim-to-approval, payout completion, repeat visits and organic shares. No promise of earnings without real work.
- Brand name/domain/trademark clearance is not yet performed. Set a proper public origin before indexing; keep the pilot access-restricted until ready.

## Research references

- [Microtask Nigeria](https://microtask.ng/)
- [Microworker](https://microworker.app/)
- [SproutGigs proof integrity](https://sproutgigs.com/proof-integrity-standards.php)
- [Paystack webhooks](https://paystack.com/docs/payments/webhooks/), [transfer docs](https://paystack.com/docs/transfers/single-transfers/)
- [Google job posting structured data](https://developers.google.com/search/docs/appearance/structured-data/job-posting)
