# HustleNG v1.1.0 — Netlify beta

Small Tasks. Real Money. Nigeria-first micro-work marketplace. Registration and beta platform commission are free. This is a controlled pilot, not a bank or guaranteed-income service.

## Deploy on Netlify

1. Open https://app.netlify.com/start and import the existing GitHub repository `Emma1222xx/hustleng`, branch `main`.
2. Keep the repository root as the base directory. `netlify.toml` sets the build command, publish directory (`public`) and Functions directory. Do not deploy this as a static ZIP.
3. In the Netlify project, open **Data & Storage → Database** and create a PostgreSQL database. Native Netlify Database requires an eligible credit-based plan. If unavailable, provision PostgreSQL elsewhere (e.g. Neon) and set the secret `DATABASE_URL` in Netlify's environment variables with Functions scope. Use the provider's TLS connection URL. Netlify Database automatically exposes `NETLIFY_DB_URL`; the app accepts either variable, preferring Netlify's.
4. Before opening registration, set secret Functions environment variables `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 14 characters, unique and strong). Set production scope only. These are not committed. Database tables and the first administrator are created automatically on the first successful database-backed request. After confirming admin login, remove the bootstrap password from Netlify and redeploy. Removing it does not delete the account. An existing non-admin email is never promoted.
5. Trigger a new deploy after setting variables. Open the assigned Netlify URL. Check `/health` for HTTP 200 and `{"ok":true}`, sign in with the administrator, and visit `/admin`. A database setup problem produces a 503 rather than a fake working marketplace.
6. Test the full workflow using private beta participants: employer posts, operator verifies real funding and approves listing, worker claims and submits, employer reviews, worker requests payout, operator records an independently confirmed external payment. Check that simultaneous claims cannot overfill a task.

## Architecture

Netlify Functions (modern Request/Response handler), Node.js 22, PostgreSQL via pg, existing server-rendered HTML/CSS/JS served with static assets on Netlify CDN. User accounts, sessions, tasks, submissions, reports, audit history and payout references persist in PostgreSQL. Database-backed rate limiting and PostgreSQL transaction advisory locking coordinate multiple function instances. Existing pages, search, WhatsApp sharing, permissions and manual payout rules are retained. No real payment gateway is connected.

## Local development

Install Node.js 22+ and provision a disposable PostgreSQL database. Copy `.env.example` into `.env`, fill its values and run:

```sh
npm install
npm run check
npm test
node --env-file=.env server.mjs
```

Open http://localhost:3000. For Docker, supply the same environment variables and use an external PostgreSQL server. Do not expose or commit secrets. Local data is not migrated from SQLite automatically; the original V1 is available in Git history. If an existing V1 deployment contains real records, export and migrate them separately before switching hosts.

## Launch checklist

- The default database is empty, except the bootstrap admin. Illustrative listings are explicitly not jobs.
- Test database-backed account registration, authorization, simultaneous claims, review, appeals and manual payout recording in the deployed environment. The included tests cover SQL parameter conversion and the Netlify HTTP adapter, not the live database workflow.
- Keep the site private or restricted during pilot; configure verified support, privacy terms, retention and operational controls.
- Configure verified business funding, bank payout procedures, backups and monitoring. Never mark a transfer settled before confirming it externally.
- Email verification, password recovery, automated bank payments and an independent security review remain required before public launch.
- Review database plan costs, preview data isolation and Netlify usage limits. Never place production credentials in preview environments.

Official docs: https://docs.netlify.com/build/functions/configuration/ and https://docs.netlify.com/build/data-and-storage/netlify-database/tooling/
