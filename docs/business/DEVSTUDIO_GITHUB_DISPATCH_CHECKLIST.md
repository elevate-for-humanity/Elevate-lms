# DevStudio GitHub Dispatch Verification Checklist

Use this checklist to verify `build_courses`, `deploy_autopilot`, and `run_tests` operator commands in DevStudio.

## 1) Secret readiness
- [ ] `GITHUB_TOKEN` is present in runtime secrets.
- [ ] Token has `repo` and `workflow` scopes.
- [ ] Admin service has been redeployed after secret update.

## 2) Route readiness
- [ ] `POST /api/devstudio/shell` is reachable from admin runtime.
- [ ] Auth cookie/session reaches `devstudio/shell` endpoint.
- [ ] No 401/403 on dispatch request.

## 3) Command verification
Run each command from DevStudio and verify response includes `runUrl` and/or `runId`:
- [ ] `build_courses`
- [ ] `deploy_autopilot` with `service=lms`
- [ ] `deploy_autopilot` with `service=admin`
- [ ] `deploy_autopilot` with `service=both`
- [ ] `run_tests`

## 4) Failure-path verification
- [ ] Missing token returns clear operator error and remediation steps.
- [ ] 401/403 shows PAT scope guidance.
- [ ] Network failure shows endpoint reachability error.

## 5) Evidence capture
- [ ] Save GitHub Actions run URLs for each command.
- [ ] Save timestamped screenshots from DevStudio output.
- [ ] Store verification notes in release checklist.

## 6) Roll-forward criteria
Only mark complete when all of the following are true:
- [ ] All commands dispatch successfully.
- [ ] At least one run per workflow reaches GitHub Actions queue.
- [ ] Failure paths are human-readable and actionable.
