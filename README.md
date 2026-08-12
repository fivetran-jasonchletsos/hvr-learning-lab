# HVR Learning Lab

A personal, hands-on curriculum for learning **Fivetran HVR** (enterprise database & file
replication — capture, integrate, refresh, compare).

Live site: https://fivetran-jasonchletsos.github.io/hvr-learning-lab/

## Status (2026-08)

The local Docker environment this was originally built around is **on hold**: Docker Desktop
isn't permitted on Fivetran Macs. Per team feedback, there's likely already a shared cloud HVR
environment SEs can use instead — that needs to get confirmed before this repo's `lab/` gets used
for anything real. Separately, the consensus from the team was that the manual pain of installing
the Hub, placing an Agent, and troubleshooting the connection is exactly the skill gap that trips
up prospects — so the next revision of the lesson plan should walk through that by hand instead of
scripting it away, and should bring back a first-class Agent module instead of today's agentless
design. See the "Hold on" callouts on the [Local Lab tab](https://fivetran-jasonchletsos.github.io/hvr-learning-lab/#lab)
and Module 1 for the live version of this note.

## What's in it

- **Overview** — what HVR actually is, with the current status caveat up front.
- **Lesson Plan** — 11 modules, in order, from environment setup through Activate Replication,
  Refresh, live Capture/Integrate, and Compare, closing with a conceptual module on Replication
  Topologies, Agents, and High Availability. Each module names its concepts, a concrete task, and
  (where the docs give one) the literal CLI command. Progress is tracked per-module in your
  browser (localStorage). The environment these commands assume is being revisited — see Status.
- **Architecture** — Hub System, Agent, and the three interfaces (Web UI, CLI, REST API), with an
  original diagram — not a reproduction of Fivetran's docs.
- **Local Lab** — the Docker Compose reference design, prerequisites, and troubleshooting — kept
  as documentation of the architecture, not as instructions to run today.
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
