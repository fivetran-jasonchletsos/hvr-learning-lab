#!/usr/bin/env bash
# Extracts the HVR Hub+Agent tarball on first boot (idempotent — skips if $HVR_HOME/bin already
# exists, which it will on every restart since hub_home is a named volume), then starts the Hub
# server in the foreground. Because of that same idempotency check, dropping a newer/different
# tarball into lab/installers/ after the first successful extraction has no effect until you
# `docker compose down -v` to wipe hub_home — there's no re-check on later starts.
# Everything past this point (repository DB, license, admin user,
# wallet, hub name) is done once through the browser wizard at http://localhost:4340/ — see
# Module 2 in the lesson plan and lab/README.md for the exact steps. We deliberately don't script
# that part: the CLI equivalent (hvrhubserverconfig Repository_Class=... Database_User=...) uses
# per-DBMS property names the docs only show for Oracle, and guessing the PostgreSQL-specific
# key names here would be worse than just doing it once by hand.
set -euo pipefail

mkdir -p "$HVR_HOME" "$HVR_CONFIG" "$HVR_TMP"

if [ ! -x "$HVR_HOME/bin/hvrhubserver" ]; then
  # -print0 | xargs ls -t | head -n1, not a bare `find | head -n1`: if more than one tarball
  # matches (e.g. an old one left behind after a version bump), find's own output order is
  # filesystem-dependent, not newest-first — sort by mtime instead so the newest file always wins.
  TARBALL=$(find /installers -maxdepth 1 -iname 'fivetran-*hub_and_agent-linux_*.tar.gz' -print0 | xargs -r -0 ls -t | head -n1 || true)
  if [ -z "${TARBALL:-}" ]; then
    cat <<'EOF'

  ==========================================================================
   No HVR install tarball found in ./lab/installers/

   You need a Fivetran-employee dashboard download (or trial) before this
   container can do anything real:

     1. Log into https://fivetran.com/dashboard/account/downloads with your
        Fivetran account. If the Downloads tab isn't visible, file a ticket
        at https://support.fivetran.com/hc/en-us/requests/new to get HVR
        entitlement added.
     2. Download the Linux Hub+Agent tarball, e.g.
        fivetran-6.x.x_NN-hub_and_agent-linux_glibc2.28-x64-64bit_ga_patch.tar.gz
     3. Also grab a license (.lic file) if you have one, or plan to use
        `hvrlicense -r` / `hvrlicense -A` from inside the container once
        it's running (needs outbound HTTPS to fivetran.com).
     4. Drop both files into lab/installers/ and re-run:
          docker compose up --build hvr-hub

   See docs/hvr6/install-and-upgrade/download for the source of this.
  ==========================================================================

EOF
    exec sleep infinity
  fi

  umask 022
  echo "Extracting $TARBALL into $HVR_HOME ..."
  tar xzf "$TARBALL" -C "$HVR_HOME"
fi

hvrhubserverconfig HTTP_Port=4340

echo ""
echo "HVR Hub starting on http://localhost:4340/ — finish setup there (System Setup wizard)."
echo "Repository DB: host=repo-db port=5432 db=hvr_repo user=hvr_repo password=hvr_repo_pw"
echo ""

exec hvrhubserver
