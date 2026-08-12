#!/usr/bin/env bash
# Fires a small burst of INSERT/UPDATE/DELETE activity at the source database so you have
# something for HVR's Capture/Integrate jobs to pick up. Run this after Activate Replication
# is running (Module 7) to watch changes flow through to the target in near real time.
set -euo pipefail

PGHOST=${PGHOST:-localhost}
PGPORT=${PGPORT:-5433}
PGUSER=${PGUSER:-hvr_source}
PGPASSWORD=${PGPASSWORD:-hvr_source_pw}
PGDATABASE=${PGDATABASE:-sourcedb}
export PGPASSWORD

# bash's $RANDOM is only a 15-bit value (0-32767), so a single draw modulo 90000 never spans
# the full 10000-99999 range it looks like it should; combine two draws for real spread.
NEXT_ORDER_ID=$(( (RANDOM * 32768 + RANDOM) % 90000 + 10000 ))

echo "Inserting a new order..."
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c \
  "INSERT INTO orders (order_id, customer_id, order_status, order_total) VALUES ($NEXT_ORDER_ID, 2, 'PENDING', 42.00);"

echo "Updating an existing order..."
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c \
  "UPDATE orders SET order_status = 'SHIPPED', updated_at = now() WHERE order_id = 101;"

echo "Deleting the oldest remaining order..."
# The original seed row 103 (order_id) only exists the first time this script runs; on every
# later run it's already gone, so a hardcoded id would match zero rows and print false success
# (psql exits 0 on a zero-row DELETE). Deleting whatever the lowest surviving order_id is keeps
# this step meaningful — and something to watch replicate — on every run.
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c \
  "DELETE FROM orders WHERE order_id = (SELECT MIN(order_id) FROM orders);"

echo "Done. Check the target database (port 5434) after the next Integrate cycle."
