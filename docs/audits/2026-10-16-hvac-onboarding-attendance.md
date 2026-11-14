# HVAC onboarding and online attendance

All current and future HVAC program enrollments use one shared dashboard guide. The program plan is four weeks online followed by two weeks at the facility. Calendar dates require staff confirmation.

The dashboard and Attendance page expose the online study clock. Enrollment ownership and active status are checked server-side. Server timestamps, transaction locks and a unique open-session index prevent fabricated timestamps and overlapping sessions. Closing a session creates a pending attendance_hours record in the existing staff verification workflow. Sessions over 12 hours close with zero logged hours and an elapsed-time note for staff correction. Facility geofencing remains separate.

The orientation has twenty accessible slides with play/pause/previous/next controls and complete readable text. A six-minute MP4 was separately delivered. Document approval remains a staff action; future students are not automatically marked complete.

Validation: LMS typecheck passed. Focused ESLint passed (existing pages-directory warning). PostgreSQL/PGlite tests cover unauthorized enrollment, invalid action, missing session, duplicate clock-in, suspension, server-calculated hours, staff verification, long sessions and service-only RPC access. New TS/TSX syntax checks pass. Run the regression script with TypeScript and @electric-sql/pglite@0.3.14 available, or set HVAC_TEST_DEPS to the absolute package.json path of an isolated test dependency installation.

The two migrations are applied to the database and their server migration versions match the filenames. No Cloud Run deployment has been triggered by this work. Live learner clock-in/clock-out still needs verification after the application rollout.
