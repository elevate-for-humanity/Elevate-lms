# LMS Production Deployment

Production uses Google Cloud only. The automatic `main` trigger is `.github/workflows/deploy-google-lms-trigger.yml`; it invokes the shared Google image-build and deployment workflows.

Verification requires the immutable image for the requested SHA, a ready Cloud Run revision, healthy `/api/ping` and `/api/health` responses, and the matching live runtime SHA. Do not infer deployment success from a completed build alone.
