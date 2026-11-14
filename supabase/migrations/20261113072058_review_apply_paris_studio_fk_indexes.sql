-- History receipt for the supervised application of canonical migration
-- 20261112130000 during the 2026-11-13 independent review. That migration's
-- original version and SQL are recorded in production schema_migrations.
-- Fresh databases execute the canonical file in timestamp order; never replay
-- its obsolete integer-returning requeue function after 20261112190000.
select 1;
