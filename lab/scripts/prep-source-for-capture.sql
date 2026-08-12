-- Module 4: PostgreSQL-as-source prerequisites for HVR logical-replication capture.
-- Run against sourcedb as a superuser (the default hvr_source user already is one in this lab
-- container, since postgres:16's default user gets superuser — in a real deployment you'd grant
-- REPLICATION narrowly and only add SUPERUSER transiently for the Activate step, then revoke it).

ALTER TABLE customers REPLICA IDENTITY DEFAULT;  -- uses the primary key; fine since both tables have one
ALTER TABLE orders    REPLICA IDENTITY DEFAULT;

-- wal_level=logical is already set at the container level in docker-compose.yml.
-- HVR's own capture job will create and manage its replication slot when you Activate Replication —
-- you don't create the slot by hand.
