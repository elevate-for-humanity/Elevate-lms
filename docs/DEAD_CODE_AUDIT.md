# Dead Code Audit — Historical Notice

The June 2025 static dead-code report that previously occupied this path is retired.

It must not be used as deletion authority. The repository is now a multi-app system and several components previously reported as having zero references were later wired into production or retained as canonical capabilities. A zero-import result is therefore only a discovery signal, not proof that a feature should be removed.

Current cleanup authority is `docs/audits/AI_REPOSITORY_CONSOLIDATION_2026-08-22.md` together with current dependency searches, runtime route ownership, database ownership, and build/test evidence.

Every cleanup candidate must be classified before removal:

- KEEP — active canonical capability.
- FINISH — incomplete capability whose product purpose is still required.
- MERGE — useful behavior that belongs in another canonical system.
- MIGRATE-FIRST — legacy implementation with active callers/data that must be moved first.
- DELETE — fully superseded or obsolete implementation with no required callers/data.
- ARCHIVE — historical evidence or documentation that should not control current architecture.

The previous report remains available through Git history for forensic reference. Do not restore its blanket recommendations such as deleting all zero-reference components or treating the old root redirect map as the current application architecture.
