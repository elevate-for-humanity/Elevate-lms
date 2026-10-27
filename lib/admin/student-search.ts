export function studentMatchesSearch(
  student: {
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
  },
  search: string,
): boolean {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return [
    student.full_name,
    `${student.first_name ?? ''} ${student.last_name ?? ''}`,
    student.email,
    student.phone,
  ].some((value) => value?.toLowerCase().includes(term));
}
