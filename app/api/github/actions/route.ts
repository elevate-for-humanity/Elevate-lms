

import { NextRequest, NextResponse } from 'next/server';
import { gh, parseRepo, getUserOctokit } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

// List workflows and runs
async function _GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

const userToken = req.headers.get('x-gh-token');
  const repo = req.nextUrl.searchParams.get('repo');
  const type = req.nextUrl.searchParams.get('type') || 'runs';
  const workflowId = req.nextUrl.searchParams.get('workflow_id');
  const runId = req.nextUrl.searchParams.get('run_id');
  const branch = req.nextUrl.searchParams.get('branch');

  if (!repo) {
    return NextResponse.json({ error: 'Missing repo parameter' }, { status: 400 });
  }

  try {
    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Get single run details
    if (runId) {
      const { data: run } = await client.actions.getWorkflowRun({
        owner,
        repo: name,
        run_id: parseInt(runId),
      });

      // Get jobs for this run
      const { data: jobs } = await client.actions.listJobsForWorkflowRun({
        owner,
        repo: name,
        run_id: parseInt(runId),
      });

      return NextResponse.json({
        ...run,
        jobs: jobs.jobs.map(job => ({
          id: job.id,
          name: job.name,
          status: job.status,
          conclusion: job.conclusion,
          started_at: job.started_at,
          completed_at: job.completed_at,
          steps: job.steps?.map(step => ({
            name: step.name,
            status: step.status,
            conclusion: step.conclusion,
            number: step.number,
          })),
        })),
      });
    }

    // List workflows
    if (type === 'workflows') {
      const { data } = await client.actions.listRepoWorkflows({
        owner,
        repo: name,
      });

      return NextResponse.json(data.workflows.map(w => ({
        id: w.id,
        name: w.name,
        path: w.path,
        state: w.state,
        badge_url: w.badge_url,
      })));
    }

    // List runs
    const params: any = {
      owner,
      repo: name,
      per_page: 20,
    };

    if (workflowId) {
      params.workflow_id = parseInt(workflowId);
    }
    if (branch) {
      params.branch = branch;
    }

    const { data } = workflowId
      ? await client.actions.listWorkflowRuns(params)
      : await client.actions.listWorkflowRunsForRepo(params);

    return NextResponse.json(data.workflow_runs.map(run => ({
      id: run.id,
      name: run.name,
      workflow_id: run.workflow_id,
      head_branch: run.head_branch,
      head_sha: run.head_sha,
      status: run.status,
      conclusion: run.conclusion,
      event: run.event,
      created_at: run.created_at,
      updated_at: run.updated_at,
      html_url: run.html_url,
      actor: {
        login: run.actor?.login,
        avatar_url: run.actor?.avatar_url,
      },
    })));
  } catch (error) {
    logger.error('GitHub actions error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch actions', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Trigger workflow / Re-run / Cancel
async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;



  const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, action, workflow_id, run_id, ref, inputs } = await req.json();

    if (!repo) {
      return NextResponse.json({ error: 'Missing repo' }, { status: 400 });
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Trigger workflow dispatch
    if (action === 'dispatch' && workflow_id) {
      await client.actions.createWorkflowDispatch({
        owner,
        repo: name,
        workflow_id,
        ref: ref || 'main',
        inputs: inputs || {},
      });

      return NextResponse.json({
        ok: true,
        message: 'Workflow triggered',
      });
    }

    // Re-run workflow
    if (action === 'rerun' && run_id) {
      await client.actions.reRunWorkflow({
        owner,
        repo: name,
        run_id: parseInt(run_id),
      });

      return NextResponse.json({
        ok: true,
        message: 'Workflow re-run triggered',
      });
    }

    // Re-run failed jobs only
    if (action === 'rerun-failed' && run_id) {
      await client.actions.reRunWorkflowFailedJobs({
        owner,
        repo: name,
        run_id: parseInt(run_id),
      });

      return NextResponse.json({
        ok: true,
        message: 'Failed jobs re-run triggered',
      });
    }

    // Cancel workflow
    if (action === 'cancel' && run_id) {
      await client.actions.cancelWorkflowRun({
        owner,
        repo: name,
        run_id: parseInt(run_id),
      });

      return NextResponse.json({
        ok: true,
        message: 'Workflow cancelled',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('GitHub actions trigger error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to trigger action', message: toErrorMessage(error) },
      {
 status: 500 }
    );
  }
}

// Get workflow logs
async function _PUT(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, job_id } = await req.json();

    if (!repo || !job_id) {
      return NextResponse.json({ error: 'Missing repo or job_id' }, { status: 400 });
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    const { data } = await client.actions.downloadJobLogsForWorkflowRun({
      owner,
      repo: name,
      job_id: parseInt(job_id),
    });

    // data is a redirect URL or the logs directly
    return NextResponse.json({
      logs: typeof data === 'string' ? data : 'Logs available at redirect URL',
      url: typeof data === 'string' ? null : data,
    });
  } catch (error) {
    logger.error('GitHub actions logs error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to get logs', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/github/actions', _GET);
export const POST = withApiAudit('/api/github/actions', _POST);
export const PUT = withApiAudit('/api/github/actions', _PUT);
