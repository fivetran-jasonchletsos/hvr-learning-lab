# HVR Learning Lab

A personal, hands-on curriculum for learning **Fivetran HVR** (enterprise database & file
replication — capture, integrate, refresh, compare), paired with a real local demo environment.

Live site: https://fivetran-jasonchletsos.github.io/hvr-learning-lab/

## What's in it

- **Overview** — what HVR actually is, and the honest caveat up front: no macOS build, so the Hub
  runs inside a Linux container here.
- **Lesson Plan** — 11 modules, in order, from standing up the Docker lab through Activate
  Replication, Refresh, live Capture/Integrate, and Compare, closing with a conceptual module on
  Replication Topologies, Agents, and High Availability. Each module names its concepts, a
  concrete task, and (where the docs give one) the literal CLI command. Progress is tracked
  per-module in your browser (localStorage).
- **Architecture** — Hub System, Agent, and the three interfaces (Web UI, CLI, REST API), with an
  original diagram — not a reproduction of Fivetran's docs.
- **Local Lab** — the Docker Compose stack, prerequisites, quickstart, and troubleshooting.
- **Glossary** — the vocabulary the docs assume you already know.

## How it's built

Static HTML/CSS/JS, no build step. All content lives in `docs/content.js`; the app (`docs/app.js`)
renders every view from it. Served from `docs/` via GitHub Pages.

## The actual lab

See [`lab/README.md`](lab/README.md) for the Docker Compose environment: an HVR Hub (Linux
container), a repository database, a source database, and a target database — everything the
lesson plan's hands-on steps run against. You'll need your own HVR install tarball and license;
the lab README explains where to get one as a Fivetran employee.

Content is written from the public [HVR 6 documentation](https://fivetran.com/docs/hvr6), in plain
language, as study notes — not a reproduction of the docs. Not an official Fivetran resource.
