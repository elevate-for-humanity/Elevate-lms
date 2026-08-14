# LMS Production Deployment

This file documents the canonical LMS production deployment trigger.

The LMS is deployed from `main` through `.github/workflows/deploy-lms.yml` to the `elevate-lms` Northflank service. Production verification requires `/api/ping` and `/api/health` to return healthy responses and the deployed runtime SHA to match the deployment SHA.

Updated during the 2026-08-14 production recovery to ensure the repaired canonical `main` revision is deployed through the LMS path-filtered workflow.
