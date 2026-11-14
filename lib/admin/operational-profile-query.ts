/** Exclude explicit test domains/QA labels while keeping missing optional fields. */
export function excludeQaProfiles<T extends { or: (filters: string) => T }>(query: T): T {
  return query
    .or(
      'email.is.null,and(email.not.ilike.%@qa.invalid,email.not.ilike.%.test,email.not.ilike.%@example.com,email.not.ilike.%@elevate-test.dev,email.not.ilike.%@test.elevateforhumanity.org)',
    )
    .or('full_name.is.null,full_name.not.ilike.[QA%');
}
