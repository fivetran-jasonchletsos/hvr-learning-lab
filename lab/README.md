# HVR Learning Lab — local demo environment

A local, agentless HVR replication setup: one HVR Hub (running in a Linux container, since HVR
has no macOS build) replicating a small `customers`/`orders` schema from a source Postgres
database to an initially-empty target Postgres database, with a repository Postgres database
backing the Hub itself.

```
┌────────────┐        ┌─────────────────────┐        ┌────────────┐
│ source-db  │──────▶│  hvr-hub (Linux)     │──────▶│ target-db  │
│ Postgres   │ libpq  │  Capture / Integrate │ libpq  │ Postgres   │
│ :5433      │        │  Scheduler, :4340    │        │ :5434      │
└────────────┘        └──────────┬───────────┘        └────────────┘
                                  │ libpq
                            ┌─────▼──────┐
                            │ repo-db    │
                            │ Postgres   │
                            │ :5435      │
                            └────────────┘
```

This is deliberately **agentless** — the Hub connects directly to both Postgres locations over
the DBMS protocol (libpq) instead of installing a separate HVR Agent next to each database. That's
a documented, supported pattern (see Architecture: "HVR can also support an agent-less
architecture"); Agents are for when you want capture/compression work done on a remote machine
instead of by the Hub. See Module 11 in the lesson plan for when you'd add one.

## What you need before this works

HVR isn't open-source and isn't instantly downloadable. You need:

1. **The Linux Hub+Agent tarball.** As a Fivetran employee, check
   [fivetran.com/dashboard/account/downloads](https://fivetran.com/dashboard/account/downloads)
   first — if the Downloads tab isn't there, file a ticket at
   [support.fivetran.com](https://support.fivetran.com/hc/en-us/requests/new) to get HVR
   entitlement added to your account. (The public [test-drive form](https://www.fivetran.com/cdc-database-replication)
   is the fallback if that doesn't pan out — it's lead-gen, so expect a delay, not an instant link.)
2. **A license.** Once the Hub is running you can self-register via `hvrlicense -r` + `hvrlicense -A`
   (needs outbound HTTPS to fivetran.com, 7-day auto-renewing) — no separate ask needed for this part.
3. Drop the tarball (and a `.lic` file if you have one) into `lab/installers/` — that directory is
   gitignored, nothing proprietary ever gets committed.

## Quickstart

```bash
cd lab
docker compose up -d repo-db source-db target-db
docker compose up --build hvr-hub   # prints setup instructions if installers/ is empty
```

Once the tarball is in `lab/installers/` and the Hub container is running, open
**http://localhost:4340/** and walk the System Setup wizard:

- Repository DB: PostgreSQL, host `repo-db`, port `5432`, database `hvr_repo`, user `hvr_repo`,
  password `hvr_repo_pw`
- License: "Register with Fivetran Account" (if you have dashboard access) or "Add License
  Manually" with your `.lic` file
- Admin user: any username, password 10+ characters
- Wallet: Software (or Disabled for a throwaway lab)
- Hub name: `myhub`

From there, follow the lesson plan on the site (Modules 5–10) to create Locations pointing at
`source-db`/`target-db`, build a channel, activate replication, run the initial Refresh, generate
live changes, and verify with Compare.

## Services

| Service | Role | Access |
|---|---|---|
| `repo-db` | HVR Hub's repository database | `psql -h localhost -p 5435 -U hvr_repo -d hvr_repo` |
| `source-db` | Replication source, seeded with `customers`/`orders` | `psql -h localhost -p 5433 -U hvr_source -d sourcedb` |
| `target-db` | Replication target, starts empty | `psql -h localhost -p 5434 -U hvr_target -d targetdb` |
| `hvr-hub` | HVR Hub server + web UI | http://localhost:4340/ |

## Scripts

- `scripts/prep-source-for-capture.sql` — sets `REPLICA IDENTITY` on the demo tables (Module 4).
- `scripts/prep-target-for-integrate.sql` — target grants (Module 4).
- `scripts/generate-changes.sh` — fires an INSERT/UPDATE/DELETE burst at `source-db` so you have
  something for a running Capture/Integrate job to pick up (Module 9).

## Resetting

```bash
docker compose down -v   # wipes all data + the Hub's extracted install, keeps your tarball/license
```
