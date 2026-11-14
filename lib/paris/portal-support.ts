export type PortalSupportIssue = {
  workflow: string;
  message: string;
  status?: number;
  page?: string;
};

export const PARIS_PORTAL_ISSUE_EVENT = 'paris:portal-issue';

export type PortalIssueReceipt = {
  status: 'reporting' | 'reported' | 'failed';
  incidentId?: string;
  httpStatus?: number;
};

/** A UI acknowledgement requires the authenticated endpoint's durable receipt. */
export async function reportPortalWorkflowIssue(
  issue: PortalSupportIssue,
  request: typeof fetch = fetch,
): Promise<PortalIssueReceipt> {
  try {
    const response = await request('/api/paris/workflow-incident', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      credentials: 'same-origin', body: JSON.stringify(issue),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.ok !== true || typeof body.incidentId !== 'string' || !body.incidentId.trim()) {
      return {status: 'failed', httpStatus: response.status};
    }
    return {status: 'reported', incidentId: body.incidentId, httpStatus: response.status};
  } catch {
    return {status: 'failed'};
  }
}

/** Send a safe workflow failure to the global PARIS support surface. */
export function askParisForPortalHelp(issue: PortalSupportIssue) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<PortalSupportIssue>(PARIS_PORTAL_ISSUE_EVENT, {
    detail: { ...issue, page: issue.page || window.location.pathname },
  }));
}
