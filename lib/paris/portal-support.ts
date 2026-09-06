export type PortalSupportIssue = {
  workflow: string;
  message: string;
  status?: number;
  page?: string;
};

export const PARIS_PORTAL_ISSUE_EVENT = 'paris:portal-issue';

/** Send a safe workflow failure to the global PARIS support surface. */
export function askParisForPortalHelp(issue: PortalSupportIssue) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<PortalSupportIssue>(PARIS_PORTAL_ISSUE_EVENT, {
    detail: { ...issue, page: issue.page || window.location.pathname },
  }));
}
