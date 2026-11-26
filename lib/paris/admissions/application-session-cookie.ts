/** Reject malformed browser state before querying a UUID project column. */
export function parseApplicationSessionCookie(raw: string | undefined): { projectId: string; resumeToken: string } | null {
  if (!raw) return null;
  const separator = raw.indexOf('.');
  if (separator <= 0) return null;
  const projectId = raw.slice(0, separator);
  const resumeToken = raw.slice(separator + 1);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) return null;
  if (resumeToken.length < 20 || resumeToken.length > 200) return null;
  return { projectId, resumeToken };
}
