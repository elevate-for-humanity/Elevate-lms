# Runtime Deploy Tooling Setup

> **Current status (2026-06-04):** Elevate is deployed through Northflank. The AWS/ECS/CodeBuild instructions below are retained as legacy migration reference only. Use Northflank build, environment variable, and deploy workflows for active production operations.

How to configure the deploy toolchain for Elevate LMS on a new machine or CI environment.

## Current Northflank deploy baseline

- Node 20+ and pnpm 10+
- Northflank dashboard/API access
- Northflank environment variables/secrets configured for LMS, Admin, and Dev Studio shell runtimes
- Separate build commands:
  - `pnpm run build:lms:phased`
  - `pnpm run build:admin`

## Legacy AWS prerequisites

- AWS CLI v2 (`brew install awscli` or https://aws.amazon.com/cli/)
- Docker with buildx (`docker buildx version`)
- Python 3 (for task definition patching in buildspecs)
- Node 20+ and pnpm 10+

## Legacy AWS credentials

Configure with the deploy IAM user (not root):

```bash
aws configure
# AWS Access Key ID: <from SSM or 1Password>
# AWS Secret Access Key: <from SSM or 1Password>
# Default region: us-east-1
# Default output format: json
```

Required IAM permissions:

- `ecr:GetAuthorizationToken`, `ecr:BatchGetImage`, `ecr:PutImage`
- `ecs:RegisterTaskDefinition`, `ecs:UpdateService`, `ecs:DescribeServices`
- `ssm:GetParameter`, `ssm:GetParametersByPath`
- `sts:GetCallerIdentity`

## Validate setup

```bash
./scripts/setup-deploy-runtime.sh
```

This checks AWS credentials, Docker, ECR repos, ECS clusters, and required SSM parameters.

## Legacy manual AWS deploy (without CodeBuild)

**Admin:**

```bash
./scripts/deploy-admin-ecs.sh                  # deploy :latest
./scripts/deploy-admin-ecs.sh <tag>            # deploy specific image tag
./scripts/deploy-admin-ecs.sh --rollback       # re-deploy current task def
```

**LMS** — use the same pattern via AWS CLI directly or trigger a CodeBuild run:

```bash
aws codebuild start-build --project-name elevate-lms-build
```

## Legacy S3 source override (when GitHub push is unavailable)

```bash
# Package source
cd /path/to/Elevate-lms
git archive --format=zip HEAD -o /tmp/elevate-source.zip

# Upload
aws s3 cp /tmp/elevate-source.zip s3://elevate-codebuild-source-954718262498/source.zip

# Start build
aws codebuild start-build \
  --project-name elevate-lms-build \
  --source-type-override S3 \
  --source-location-override elevate-codebuild-source-954718262498/source.zip
```

## Environment variables

For the current Northflank deployment, store runtime values in Northflank environment/secrets. The legacy AWS flow stored secrets in SSM Parameter Store under `/elevate/`; those references are no longer the current production source of truth.

Legacy AWS example for adding a historical SSM secret:

```bash
aws ssm put-parameter \
  --name "/elevate/MY_NEW_SECRET" \
  --value "the-value" \
  --type SecureString \
  --overwrite
```

For legacy AWS only, add the corresponding `export` line to `aws/buildspec-lms.yml` and/or
`aws/buildspec-admin.yml` in the `pre_build` phase. For Northflank, configure the variable in the Northflank environment/secrets UI instead.

## Legacy CodeBuild projects

| Project                            | Builds                          | Deploys to               |
| ---------------------------------- | ------------------------------- | ------------------------ |
| `elevate-lms-build`                | LMS Next.js app                 | `elevate-lms-service`    |
| `elevate-admin-build`              | Admin Next.js app               | `elevate-admin-service`  |
| GitHub Actions `deploy-studio.yml` | Dev Studio shell WebSocket task | `elevate-studio-service` |

Both projects are in `us-east-1`. Source is GitHub (`elevateforhumanity/Elevate-lms`, `main` branch)
or S3 override (see above).
