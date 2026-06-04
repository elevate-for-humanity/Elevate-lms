# Dev Studio Activation Evidence — 2026-05-29

## Objective

Activate the Dev Studio shell path without refactoring unrelated enrollment, Stripe, testing-center, or build-stability work.

PASS for this phase still requires a live browser terminal session that connects and returns a shell prompt. This repository-only pass fixed the service-name mismatch and added a repeatable preflight check, but live AWS verification is blocked in this container because the AWS CLI is unavailable.

## Fixed in this pass

| Area                       | Result | Evidence                                                                                                                                             |
| -------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Studio ECS service naming  | Fixed  | Dev Studio status and service-management APIs now target `elevate-studio-service`, matching the requested production service naming.                 |
| Studio deploy workflow     | Fixed  | `deploy-studio.yml` now deploys service `elevate-studio-service` while creating from task family `elevate-studio`.                                   |
| Admin ECS status UI        | Fixed  | The status panel now labels the studio service as `Dev Studio Shell` and shows the task's 1 vCPU / 4 GB / port 8888 shape.                           |
| Public/local shell URL env | Fixed  | `.env.example` now includes `STUDIO_SHELL_WS_URL_PUBLIC` and the Cloud Map internal URL example.                                                     |
| Repeatable evidence        | Added  | `node scripts/devstudio-activation-check.mjs` verifies task definitions, workflow wiring, and live AWS state when AWS CLI credentials are available. |

## Preflight run in this container

Command:

```bash
node scripts/devstudio-activation-check.mjs
```

Observed result:

| Status  | Check                                                       | Evidence                                                                                          |
| ------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| PASS    | Admin task definition includes `STUDIO_SHELL_SECRET`        | Present in `aws/ecs-task-admin.json` secrets.                                                     |
| PASS    | Admin task definition includes `STUDIO_TOKEN_SECRET`        | Present in `aws/ecs-task-admin.json` secrets.                                                     |
| PASS    | Admin task definition includes `STUDIO_SHELL_WS_URL`        | Present in `aws/ecs-task-admin.json` secrets.                                                     |
| PASS    | Admin task definition includes `STUDIO_SHELL_WS_URL_PUBLIC` | Present in `aws/ecs-task-admin.json` secrets.                                                     |
| PASS    | Studio task receives `STUDIO_SHELL_SECRET`                  | `aws/ecs-task-studio.json` maps `/elevate/STUDIO_SHELL_SECRET` into container env `SHELL_SECRET`. |
| PASS    | Deploy workflow targets canonical studio service            | `ECS_SERVICE` is `elevate-studio-service`.                                                        |
| PASS    | Deploy workflow creates service from task family            | `create-service` uses task family `elevate-studio`, not the ECS service name.                     |
| BLOCKED | Live SSM/ECS verification                                   | AWS CLI is not installed in this container.                                                       |

## Legacy live activation commands for AWS runner

Run these from a workstation/runner with AWS CLI credentials for account `954718262498` in `us-east-1`:

```bash
node scripts/devstudio-activation-check.mjs
node scripts/devstudio-activation-check.mjs --redeploy
aws ecs wait services-stable \
  --cluster elevate-cluster \
  --services elevate-admin-service elevate-studio-service
```

After the services are stable, open Admin → Dev Studio → Terminal and verify that the terminal reaches a shell prompt. That browser terminal check is the only PASS condition for Dev Studio activation.

## Legacy AWS blockers

| Blocker                       | Owner          | Required evidence                                                                                                      |
| ----------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Confirm SSM values exist live | AWS/operator   | `STUDIO_SHELL_SECRET`, `STUDIO_TOKEN_SECRET`, `STUDIO_SHELL_WS_URL`, and `STUDIO_SHELL_WS_URL_PUBLIC` returned by SSM. |
| Force redeploy                | AWS/operator   | `elevate-admin-service` and `elevate-studio-service` updated with `forceNewDeployment=true` and services stable.       |
| Terminal prompt               | Admin/operator | Screenshot or log showing Dev Studio terminal connected to the shell prompt.                                           |

## 2026-06-04 update — AWS activation steps are legacy

This evidence file was written while AWS/ECS/SSM was still documented as the runtime target. The project is no longer on AWS. Keep the code-path findings for Dev Studio, but do not use the AWS activation commands as the current launch checklist. Current Dev Studio validation must verify Northflank has `STUDIO_SHELL_SECRET`, `STUDIO_TOKEN_SECRET`, `STUDIO_SHELL_WS_URL`, and `STUDIO_SHELL_WS_URL_PUBLIC` configured, redeploy the Northflank admin/shell runtimes, and capture a browser screenshot or log showing a shell prompt.
