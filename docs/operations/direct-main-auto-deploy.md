# Direct-to-main automatic deployment

For approved routine changes, commit directly to `main` when repository permissions permit it. Do not create a pull request unless GitHub branch rules require one, or a change requires explicit review.

## Production release contracts

- Admin application and shared library changes on `main` trigger `.github/workflows/deploy-admin.yml`.
- Ultimate Course Builder worker and instructional source changes on `main` trigger `.github/workflows/deploy-google-course-worker.yml`.
- The course worker deployment completion triggers `.github/workflows/dispatch-google-course-job.yml` to continue pending work; course submission also explicitly dispatches that workflow.
- A source commit is **not** proof of deployment. Check the relevant Actions run, the live revision, and a functional production smoke test.
- Preserve protected branch restrictions, production environment gates, automated tests, and deployment credentials. Do not bypass controls to force direct commits.
- Never mark a course published until all media, instructional, narration, and learner checks pass.
- Do not recreate canonical courses or reset existing enrollments to retry a failed build.

If GitHub rejects a direct commit to `main`, report the branch restriction and use the authorized review process rather than claiming direct deployment succeeded.
