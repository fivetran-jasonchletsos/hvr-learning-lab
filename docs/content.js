window.HVR_CONTENT = {

  overview: {
    heading: "What HVR is, and why this lab exists",
    lede: "Fivetran HVR is the enterprise database &amp; file replication product — log-based capture, low-latency continuous replication, and real-time change data capture between DBMSs, not the SaaS-connector side of Fivetran most SEs demo day to day.",
    paragraphs: [
      `This is a personal, hands-on curriculum built from the public <a href="https://fivetran.com/docs/hvr6" target="_blank" rel="noopener">HVR 6 documentation</a>. It pairs a step-by-step lesson plan with a real local lab: a Hub server, a source database, and a target database, all running in Docker so you can actually activate replication, run a refresh, break something, and fix it with Compare — instead of just reading about it.`,
      `HVR has no macOS build. The Hub Server and Agent are only supported on Linux and Windows. This lab runs the Hub inside a Linux container so it works on a Mac — that's an inference from the plain-glibc-tarball install method, not an officially documented deployment path. See the <a href="#lab" data-view="lab">Local Lab</a> tab for the honest caveats.`,
      `You'll also need an actual HVR install tarball and license — this isn't open-source software. See the Local Lab tab for where to get it as a Fivetran employee.`,
    ],
    highlights: [
      { title: "Hub &amp; Agent", body: "One central Hub orchestrates replication; Agents (optional) do capture/integrate work next to a remote database. This lab runs agentless — the Hub connects to Postgres directly." },
      { title: "Channel", body: "The logical container: a source Location Group, a target Location Group, a set of tables, and the actions that govern how they replicate." },
      { title: "Capture → Integrate", body: "Capture reads changes out of the source's transaction log; Integrate applies them to the target. Refresh does the bulk initial load; Compare proves the two sides still agree." },
      { title: "11 modules", body: "From standing up the Docker lab through Activate Replication, Refresh, live change capture, and Compare — plus a closing conceptual module on topologies, Agents, and HA." },
    ],
  },

  lessonsIntro: "Work through these in order. Each one maps to a concept from the docs and a concrete task in the local lab — check them off as you go (saved in your browser, nowhere else).",

  modules: [
    {
      id: "m1",
      title: "Environment bootstrap",
      concepts: ["Hub", "Location", "Agentless architecture", "Supported Platforms"],
      objective: "Stand up the Docker lab — a repository database, a source database, a target database, and a Hub container — and understand why the Hub has to run inside a Linux container on a Mac.",
      steps: [
        "Read Architecture and HVR Agent in the docs — note the distinction between the Hub System and an Agent, and that HVR supports an agent-less mode where the Hub connects straight to a database over its native protocol.",
        "Read the platform support matrix and confirm for yourself: no macOS anywhere, Linux/Windows for the Hub, plus AIX/Solaris for Agent-only installs.",
        "Clone this repo if you haven't, then bring up the three Postgres containers first so the Hub has somewhere to point once it's running.",
      ],
      commands: [
        "cd lab\ndocker compose up -d repo-db source-db target-db\ndocker compose ps"
      ],
    },
    {
      id: "m2",
      title: "Install the Hub & complete System Setup",
      concepts: ["Install and Upgrade", "Licensing", "Repository Database"],
      objective: "Get the real HVR Hub tarball onto disk, start the Hub server, and complete the browser-based System Setup wizard — repository DB, license, admin user, wallet, hub name.",
      steps: [
        "Get the Linux Hub+Agent tarball from your Fivetran dashboard Downloads tab (or a support ticket if it's not visible), and a license file if you have one. Drop both into <code>lab/installers/</code>.",
        "Build and start the Hub container — the entrypoint script extracts the tarball and starts <code>hvrhubserver</code> on port 4340.",
        "Open http://localhost:4340/ and run the System Setup wizard: PostgreSQL repository DB pointed at <code>repo-db</code>, then either “Register with Fivetran Account” or “Add License Manually,” then create an admin user, choose a wallet type, and name the hub <code>myhub</code>.",
      ],
      commands: [
        "docker compose up --build hvr-hub\n# inside the container, this runs automatically:\n#   hvrhubserverconfig HTTP_Port=4340\n#   hvrhubserver"
      ],
    },
    {
      id: "m3",
      title: "Security & access model",
      concepts: ["Security Architecture", "User access levels", "Wallet"],
      objective: "Understand what the admin user you just created can do, and where credentials get encrypted at rest.",
      steps: [
        "In the Hub UI, open your admin user's settings and note the access level (SysAdmin). Compare it against the AgentAdmin level mentioned for Agent-scoped users.",
        "Note what the wallet actually protects: database and Agent connection credentials stored in the repository. A Software wallet auto-opens on Hub startup; a Disabled wallet stores things in the clear — fine for a throwaway lab, not for anything real.",
        "Optional: create a second, narrower user from the CLI to see the pattern you'd script for onboarding teammates.",
      ],
      commands: [
        "hvruserconfig -c -A local readonly_user"
      ],
    },
    {
      id: "m4",
      title: "PostgreSQL source & target prerequisites",
      concepts: ["Capture requirements", "REPLICA IDENTITY", "Integrate requirements"],
      objective: "Run the grants and REPLICA IDENTITY settings HVR expects before it will let you capture from source-db or integrate into target-db.",
      steps: [
        "PostgreSQL as a source uses logical replication (SQL fetch from a replication slot) — you need REPLICATION privilege for ongoing capture, and briefly SUPERUSER during Activate. Direct log-file reading is deprecated as of 6.1.5/5.",
        "Every table you replicate needs a REPLICA IDENTITY. The default (primary key) is enough for this lab's two tables.",
        "PostgreSQL as a target needs SELECT/INSERT/UPDATE/DELETE plus permission to create HVR's own state tables.",
        "Run both prep scripts against their respective databases.",
      ],
      commands: [
        "psql -h localhost -p 5433 -U hvr_source -d sourcedb -f lab/scripts/prep-source-for-capture.sql\npsql -h localhost -p 5434 -U hvr_target -d targetdb -f lab/scripts/prep-target-for-integrate.sql"
      ],
    },
    {
      id: "m5",
      title: "Create the Locations",
      concepts: ["Location", "Location Group", "Capture vs Integrate capability"],
      objective: "Register source-db and target-db as HVR Locations — agentless, connecting directly over the PostgreSQL protocol.",
      steps: [
        "In the Hub UI: Create New Location, PostgreSQL, connect directly (no Agent) to <code>source-db:5432 / sourcedb</code> with user <code>hvr_source</code>.",
        "Repeat for the target: <code>target-db:5432 / targetdb</code> with user <code>hvr_target</code>.",
        "Once both exist, export their definitions to JSON — this is the round-trip pattern for turning a UI-built config into something you can check into version control and replay.",
      ],
      commands: [
        "hvrdefinitionexport -l source_pg myhub > lab/definitions/source_pg.json\nhvrdefinitionexport -l target_pg myhub > lab/definitions/target_pg.json"
      ],
    },
    {
      id: "m6",
      title: "Create the Channel",
      concepts: ["Channel", "One-to-One topology", "Table selection"],
      objective: "Connect the two Locations into a Channel and pick the tables to replicate.",
      steps: [
        "Create New Channel, name it (lowercase, max 12 characters, e.g. <code>demochn</code>), pick “One to One”.",
        "Attach <code>source_pg</code> as the source Location Group and <code>target_pg</code> as the target.",
        "Select Tables: <code>customers</code> and <code>orders</code>. In the UI's default flow, finishing this step (Complete Channel Creation) will also activate replication and run the initial refresh in one click — that's fine, but Modules 7–8 walk through the same two steps deliberately so you know what each one does on its own.",
      ],
      commands: [],
    },
    {
      id: "m7",
      title: "Activate Replication",
      concepts: ["Activate Replication", "Jobs", "Scheduler"],
      objective: "Turn the channel on: this is what creates the Capture and Integrate jobs and hands them to the Scheduler.",
      steps: [
        "Run Activate Replication for the channel (UI dialog, or the CLI form below).",
        "Open the Jobs / Topology view and watch the capture and integrate jobs for <code>demochn</code> register and move into a running state.",
      ],
      commands: [
        "hvractivate -J cap -J refr -p2 myhub demochn"
      ],
    },
    {
      id: "m8",
      title: "Initial load with Refresh",
      concepts: ["Refresh", "Bulk vs row-by-row"],
      objective: "Bulk-load the target for the first time and confirm it now matches the source.",
      steps: [
        "Run Refresh from the source into the target — this creates the <code>customers</code> and <code>orders</code> tables in <code>targetdb</code>, which started empty by design.",
        "Confirm: query target-db and check the row counts match source-db.",
      ],
      commands: [
        "hvrrefresh -J integ -s -r source_pg -l target_pg -cbkr -gb -qrw myhub demochn\n\n# verify\npsql -h localhost -p 5434 -U hvr_target -d targetdb -c 'select count(*) from orders;'"
      ],
    },
    {
      id: "m9",
      title: "Live Capture & Integrate",
      concepts: ["Capture", "Integrate", "Continuous vs Burst"],
      objective: "Generate real changes on the source and watch them flow through to the target while replication is running.",
      steps: [
        "With the channel activated, fire a burst of INSERT/UPDATE/DELETE at the source.",
        "Give the Integrate job a moment, then check the target — it should reflect the same changes without you touching it directly.",
        "In the docs, note the difference between Continuous integrate (applies changes as they arrive) and Burst integrate (batches them) — this lab uses whichever the UI defaulted to; check the channel's Integrate action properties to see which.",
      ],
      commands: [
        "./lab/scripts/generate-changes.sh\n\n# then check the target\npsql -h localhost -p 5434 -U hvr_target -d targetdb -c 'select * from orders order by order_id;'"
      ],
    },
    {
      id: "m10",
      title: "Verify with Compare",
      concepts: ["Compare", "Corrective SQL", "Slicing"],
      objective: "Prove (or disprove) that source and target agree, then intentionally break that and watch Compare catch it.",
      steps: [
        "Run Compare Data from the channel (UI default is Online Compare) — it should report the two sides in sync.",
        "Manually change one row directly in target-db — something HVR didn't do — then re-run Compare and inspect the corrective SQL it generates.",
        "Read up on Slicing: for tables far bigger than this lab's five rows, Refresh and Compare can split a table into parallel-processed chunks (modulo, count, boundary, or series slicing) instead of scanning it as one unit.",
      ],
      commands: [
        "hvrcompare myhub demochn\n# full flag reference: docs Command Line Interface > Command Reference"
      ],
    },
    {
      id: "m11",
      title: "Topologies, Agents & High Availability (conceptual)",
      concepts: ["Replication Topologies", "HVR Agent", "HVR High Availability"],
      objective: "No infrastructure change here — this is the module where you connect what you just built to the bigger patterns the docs describe.",
      steps: [
        "This lab is a One-to-One (uni-directional) topology. Read up on the others: Broadcast (one source, many targets), Consolidation (many sources, one target), Cascading (a target re-acting as a source downstream), Bi-directional (active/active, with loopback detection and collision resolution), and Multi-directional (more than two locations kept in sync).",
        "This lab is agentless. Reread Architecture's Agent section and decide: for a real deployment where the database is remote from wherever the Hub lives, when would you install an Agent next to it instead of connecting directly?",
        "Read HVR High Availability conceptually — a single-node Docker lab can't demonstrate real failover, but you should be able to describe how Hub HA and Agent redundancy (virtual IP / load balancer, state-table-based resume) work.",
      ],
      commands: [],
    },
  ],

  architecture: {
    heading: "How the pieces fit together",
    lede: "The Hub System orchestrates everything; Locations are the endpoints; a Channel is the logical pipe between them.",
    diagramSvg: `
      <svg viewBox="0 0 640 220" width="100%" height="220" xmlns="http://www.w3.org/2000/svg" style="max-width:640px; display:block; margin:0 auto;">
        <rect x="10" y="70" width="110" height="60" rx="6" fill="none" stroke="#4c8dff" stroke-width="1.6"/>
        <text x="65" y="95" font-size="12" fill="#4c8dff" text-anchor="middle" font-family="IBM Plex Mono, monospace">SOURCE</text>
        <text x="65" y="112" font-size="10.5" fill="#9aa7c7" text-anchor="middle" font-family="IBM Plex Mono, monospace">Location</text>

        <rect x="255" y="20" width="130" height="160" rx="8" fill="none" stroke="#ff6b47" stroke-width="1.6"/>
        <text x="320" y="42" font-size="12.5" fill="#ff6b47" text-anchor="middle" font-family="IBM Plex Mono, monospace">HUB</text>
        <text x="320" y="70" font-size="10" fill="#eef1fa" text-anchor="middle" font-family="IBM Plex Mono, monospace">Scheduler</text>
        <text x="320" y="88" font-size="10" fill="#eef1fa" text-anchor="middle" font-family="IBM Plex Mono, monospace">Capture job</text>
        <text x="320" y="106" font-size="10" fill="#eef1fa" text-anchor="middle" font-family="IBM Plex Mono, monospace">Integrate job</text>
        <text x="320" y="124" font-size="10" fill="#eef1fa" text-anchor="middle" font-family="IBM Plex Mono, monospace">Router files</text>
        <text x="320" y="142" font-size="10" fill="#eef1fa" text-anchor="middle" font-family="IBM Plex Mono, monospace">Log files</text>

        <rect x="510" y="70" width="110" height="60" rx="6" fill="none" stroke="#4c8dff" stroke-width="1.6"/>
        <text x="565" y="95" font-size="12" fill="#4c8dff" text-anchor="middle" font-family="IBM Plex Mono, monospace">TARGET</text>
        <text x="565" y="112" font-size="10.5" fill="#9aa7c7" text-anchor="middle" font-family="IBM Plex Mono, monospace">Location</text>

        <rect x="255" y="190" width="130" height="26" rx="6" fill="none" stroke="#4a5a8a" stroke-width="1.2"/>
        <text x="320" y="207" font-size="10" fill="#9aa7c7" text-anchor="middle" font-family="IBM Plex Mono, monospace">Repository DB</text>

        <line x1="320" y1="180" x2="320" y2="190" stroke="#4a5a8a" stroke-width="1.2"/>
        <line x1="120" y1="100" x2="255" y2="100" stroke="#4a5a8a" stroke-width="1.4" marker-end="url(#arrow2)"/>
        <text x="187" y="93" font-size="9.5" fill="#7684a8" text-anchor="middle" font-family="IBM Plex Mono, monospace">Capture</text>
        <line x1="385" y1="100" x2="510" y2="100" stroke="#4a5a8a" stroke-width="1.4" marker-end="url(#arrow2)"/>
        <text x="447" y="93" font-size="9.5" fill="#7684a8" text-anchor="middle" font-family="IBM Plex Mono, monospace">Integrate</text>
        <line x1="65" y1="130" x2="65" y2="150" stroke="#7684a8" stroke-width="1" stroke-dasharray="3,3"/>
        <line x1="65" y1="150" x2="565" y2="150" stroke="#7684a8" stroke-width="1" stroke-dasharray="3,3"/>
        <line x1="565" y1="150" x2="565" y2="130" stroke="#7684a8" stroke-width="1" stroke-dasharray="3,3"/>
        <text x="320" y="163" font-size="9.5" fill="#7684a8" text-anchor="middle" font-family="IBM Plex Mono, monospace">Compare (bidirectional)</text>
        <defs>
          <marker id="arrow2" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#4a5a8a"/>
          </marker>
        </defs>
      </svg>`,
    sections: [
      {
        title: "HVR Hub System",
        body: "The Hub Server is the main process on the hub machine — it runs a lightweight web server for the UI/REST API and manages the Scheduler. It spawns child processes (Scheduler, worker executables) as needed and can serve multiple logical Hubs, each with its own Scheduler. The Repository Database holds every specification of every replication: databases, direction, table lists. Log files and Router files (a history of what's been captured/submitted, per-hub) round out the Hub's on-disk state.",
      },
      {
        title: "HVR Agent",
        body: "An Agent is an install co-located with a source or target machine, acting as a child process of the Hub, usually reached over TLS on a dedicated port. It exists so capture/integrate work — and the compression/encryption of what gets sent — happens close to the data instead of forcing everything through the Hub's network path. HVR also supports connecting directly to a location without an Agent, using the DBMS's own protocol (e.g. libpq for PostgreSQL, TNS for Oracle) — that's the mode this lab uses.",
      },
      {
        title: "Interfaces",
        body: "Three ways to drive HVR: the Web UI (dashboard, visualization, event log — usable on desktop or tablet), the Command Line Interface (hvr* commands, runnable on the Hub machine or remotely from any machine with an HVR install), and the REST API (for scripting or embedding HVR control into another application; also reachable with plain HTTP tools like curl without any HVR install at all).",
      },
    ],
  },

  lab: {
    heading: "Local Lab",
    lede: "A Docker Compose stack: a repository database, a source database, a target database, and the HVR Hub itself — everything you need to run every module in the lesson plan against real infrastructure.",
    macNote: "HVR has no macOS build — Hub and Agent are Linux/Windows only (plus AIX/Solaris for Agent-only). This lab runs the Hub inside a Linux container, which should work (the Linux binaries are a plain glibc 2.28+ tarball with no unusual kernel dependencies) but is <strong>not a documented-supported deployment path</strong> — treat any weirdness as “unofficial setup problem,” not “HVR bug.”",
    prerequisites: [
      "Docker Desktop (or another Docker Engine) running on your Mac.",
      "An HVR Hub+Agent Linux tarball and, ideally, a license file — see “Getting the installer” below.",
      "<code>psql</code> on your host machine is convenient for poking at source-db/target-db directly, though not required (the containers have it too).",
    ],
    quickstart: [
      "git clone https://github.com/fivetran-jasonchletsos/hvr-learning-lab.git\ncd hvr-learning-lab/lab\ndocker compose up -d repo-db source-db target-db\n# drop the tarball + license into ./installers, then:\ndocker compose up --build hvr-hub"
    ],
    services: [
      { name: "repo-db", role: "Hub's repository database", access: "psql -h localhost -p 5435 -U hvr_repo -d hvr_repo" },
      { name: "source-db", role: "Replication source (seeded)", access: "psql -h localhost -p 5433 -U hvr_source -d sourcedb" },
      { name: "target-db", role: "Replication target (starts empty)", access: "psql -h localhost -p 5434 -U hvr_target -d targetdb" },
      { name: "hvr-hub", role: "HVR Hub server + web UI", access: "http://localhost:4340/" },
    ],
    troubleshooting: [
      "<strong>Getting the installer:</strong> as a Fivetran employee, try <a href=\"https://fivetran.com/dashboard/account/downloads\" target=\"_blank\" rel=\"noopener\">fivetran.com/dashboard/account/downloads</a> first. No Downloads tab? File a ticket at <a href=\"https://support.fivetran.com/hc/en-us/requests/new\" target=\"_blank\" rel=\"noopener\">support.fivetran.com</a> to get HVR entitlement added. Fallback: the public <a href=\"https://www.fivetran.com/cdc-database-replication\" target=\"_blank\" rel=\"noopener\">test-drive form</a> (lead-gen, expect a delay).",
      "<strong>License registration fails:</strong> <code>hvrlicense -r</code> / <code>hvrlicense -A</code> need outbound HTTPS from inside the Hub container to fivetran.com — check Docker Desktop's network settings if it hangs.",
      "<strong>Hub container exits immediately:</strong> check <code>docker compose logs hvr-hub</code> — most likely the tarball glob in <code>lab/installers/</code> didn't match (entrypoint looks for <code>fivetran-*hub_and_agent-linux_*.tar.gz</code>), or a missing OS package the Perl-based install scripts expect (the image installs <code>libio-socket-ssl-perl</code> for this reason — add more if a script complains).",
      "<strong>Capture won't start:</strong> re-check Module 4 — logical replication needs <code>wal_level=logical</code> (already set on source-db) and a <code>REPLICA IDENTITY</code> on every captured table.",
      "<strong>Starting over:</strong> <code>docker compose down -v</code> wipes all container data (including the Hub's extracted install) but never touches <code>lab/installers/</code> — your tarball and license survive a full reset.",
    ],
  },

  glossary: [
    { term: "Hub", def: "The central server + repository database that stores every channel/location/user definition and runs the Scheduler. Installed once." },
    { term: "Agent", def: "An optional install co-located with a source or target that does capture/integrate work locally instead of making the Hub reach across the network." },
    { term: "Location", def: "An endpoint in a replication flow — a database, file store, or cloud service. Source-capable (Capture) or target-capable (Integrate), or both." },
    { term: "Location Group", def: "A named set of one or more Locations playing the same role (e.g. all your “source” databases) within a Channel." },
    { term: "Channel", def: "The logical unit connecting a source Location Group to a target Location Group via a set of actions on a set of tables. Everything — Capture, Integrate, Refresh, Compare — runs inside a Channel." },
    { term: "Capture", def: "The action/process that reads changes out of a source, log-based or trigger-based." },
    { term: "Integrate", def: "The action/process that applies captured changes into a target — Continuously (as they arrive) or in Bursts (batched)." },
    { term: "Refresh", def: "The initial-load / resync mechanism: bulk-copies or row-by-row syncs data from source tables into target tables, creating the targets if they don't exist." },
    { term: "Compare", def: "Verifies two or more locations hold matching data, via bulk checksum or row-by-row diff, and can generate corrective SQL." },
    { term: "Activate Replication", def: "The action that turns a configured Channel on — creates the Capture/Integrate jobs, sets up log-based capture, and starts the Scheduler managing them." },
    { term: "Scheduler", def: "The Hub-internal process managing job lifecycle (PENDING / RUNNING / ALERTING-RETRY / HANGING) across every channel on that Hub." },
    { term: "Job", def: "A running process performing one task — capture, refresh, integrate, compare, activate. Acyclic jobs run once; cyclic jobs loop." },
    { term: "Event", def: "An audited record of a user-initiated action (CLI command or UI change), with states CURRENT / WAITING / DONE / CANCELED / FAILED — long operations resume instead of restarting." },
    { term: "Slicing", def: "Splits a large table into parallel-processed chunks during Refresh or Compare (modulo, count, boundary, or series) to speed up big jobs." },
    { term: "Replication Topology", def: "The shape of a replication flow: uni-directional (one-to-one), broadcast (one-to-many), consolidation (many-to-one), cascading (target re-acts as a source), bi-directional (active/active), or multi-directional." },
    { term: "REPLICA IDENTITY", def: "PostgreSQL setting on a captured table that determines what old-row data logical replication exposes for UPDATE/DELETE. DEFAULT (primary key) is enough for most tables." },
    { term: "Wallet", def: "The Hub's encrypted store for database and Agent connection credentials. Software wallets auto-open on Hub startup; a Disabled wallet stores credentials unencrypted." },
  ],
};
