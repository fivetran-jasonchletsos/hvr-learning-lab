#!/usr/bin/env bash
# Fires a small burst of INSERT/UPDATE/DELETE activity at the source database so you have
# something for HVR's Capture/Integrate jobs to pick up. Run this after Activate Replication
# is running (Module 5) to watch changes flow through to the target in near real time.
set -euo pipefail

PGHOST=${PGHOST:-localhost}
PGPORT=${PGPORT:-5433}
PGUSER=${PGUSER:-hvr_source}
PGPASSWORD=${PGPASSWORD:-hvr_source_pw}
PGDATABASE=${PGDATABASE:-sourcedb}
export PGPASSWORD

NEXT_ORDER_ID=$(( RANDOM % 90000 + 10000 ))

echo "Inserting a new order..."
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c \
  "INSERT INTO orders (order_id, customer_id, order_status, order_total) VALUES ($NEXT_ORDER_ID, 2, 'PENDING', 42.00);"

echo "Updating an existing order..."
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c \
  "UPDATE orders SET order_status = 'SHIPPED', updated_at = now() WHERE order_id = 101;"

echo "Deleting a cancelled order..."
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c \
  "DELETE FROM orders WHERE order_id = 103;"

echo "Done. Check the target database (port 5434) after the next Integrate cycle."
