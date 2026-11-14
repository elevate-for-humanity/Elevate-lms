export function studioRepository(value: string | undefined = process.env.GITHUB_REPO): string {
  const repository = value?.trim() || 'elevate-for-humanity/Elevate-lms';
  return /^elevateforhumanity\/Elevate-lms$/i.test(repository)
    ? 'elevate-for-humanity/Elevate-lms' : repository;
}
