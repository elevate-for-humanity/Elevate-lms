# Build locally/in CI before Modal deployment. BASE_WORKER_IMAGE must be a
# source-verified immutable image containing the current approved renderer.
ARG BASE_WORKER_IMAGE
FROM ${BASE_WORKER_IMAGE}
WORKDIR /app
COPY workers/external-course-worker.mjs workers/settle-external-course-worker.mjs ./workers/
COPY lib/ultimate-course-builder/worker/job-queue.ts ./lib/ultimate-course-builder/worker/
COPY lib/ultimate-course-builder/worker/owner-preview-claim.mjs ./lib/ultimate-course-builder/worker/
RUN node --import=tsx -e "await import('./lib/ultimate-course-builder/worker/job-queue.ts')"
CMD ["node", "--import=tsx", "workers/external-course-worker.mjs"]
