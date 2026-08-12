-- Module 4: PostgreSQL-as-target prerequisites for HVR Integrate.
-- Run against targetdb. Grants below are already implied by hvr_target owning the database in
-- this lab, but this is what you'd hand to a DBA in a real environment: SELECT/INSERT/UPDATE/DELETE
-- on the tables HVR will create/populate, plus permission to create HVR's own state tables.

GRANT ALL PRIVILEGES ON DATABASE targetdb TO hvr_target;

-- Optional: disable trigger/constraint firing while HVR applies changes, via an Environment
-- action on the target location with HVR_SQL_INIT='SET session_replication_role = replica'.
-- Not needed for this lab's two plain tables — kept here as the documented pattern for when you
-- add tables with foreign keys or triggers later.
