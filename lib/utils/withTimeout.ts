/**
 * Races a promise-like operation against a timeout.
 * Rejects with an Error if the operation does not settle within `ms` milliseconds.
 * Accepting PromiseLike keeps this compatible with Supabase Postgrest builders.
 */
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  label = 'Operation',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([Promise.resolve(promise), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
