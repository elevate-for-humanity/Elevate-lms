#!/usr/bin/env node
/**
 * Check GitHub Actions Workflow Failures
 * Uses GitHub API to fetch and analyze failed workflows
 */

import https from 'https';

const REPO = 'elevateforhumanity/fix2';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Deployment-Autopilot',
        Accept: 'application/vnd.github.v3+json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Get recent workflow runs
  const runs = await makeRequest(`/repos/${REPO}/actions/runs?per_page=10`);

  if (!runs.workflow_runs) {
    return;
  }

  // Analyze each run
  for (const run of runs.workflow_runs) {
    const status =
      run.conclusion === 'failure'
        ? '❌'
        : run.conclusion === 'success'
          ? '✅'
          : run.status === 'in_progress'
            ? '🟡'
            : '⚪';

    // If failed, get job details
    if (run.conclusion === 'failure') {
      const jobs = await makeRequest(`/repos/${REPO}/actions/runs/${run.id}/jobs`);

      if (jobs.jobs) {
        for (const job of jobs.jobs) {
          if (job.conclusion === 'failure') {
            // Get steps
            if (job.steps) {
              for (const step of job.steps) {
                if (step.conclusion === 'failure') {
                }
              }
            }
          }
        }
      }
    }
  }

  // Summary
  const failed = runs.workflow_runs.filter((r) => r.conclusion === 'failure');
  const succeeded = runs.workflow_runs.filter((r) => r.conclusion === 'success');
  const inProgress = runs.workflow_runs.filter((r) => r.status === 'in_progress');

  if (failed.length > 0) {
    failed.forEach((run) => {});
  }
}

main().catch(console.error);
