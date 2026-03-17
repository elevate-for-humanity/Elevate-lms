export function isAuthorizedCronRequest(req: Request): boolean {
  const configured = process.env.CRON_SECRET;
  if (!configured) return false;

  const auth = req.headers.get("authorization");
  if (!auth) return false;

  const expected = `Bearer ${configured}`;
  return auth === expected;
}
