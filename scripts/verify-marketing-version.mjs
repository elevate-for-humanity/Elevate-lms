const SHA_PATTERN = /^[a-f0-9]{40}$/;

function describeSample(sample) {
  const status = sample.status || 'no response';
  const commitSha = sample.commitSha || 'missing';
  const error = sample.error ? `, error=${sample.error}` : '';
  return `HTTP ${status}, commit=${commitSha}${error}`;
}

export async function waitForStableMarketingVersion({
  expectedSha,
  readVersion,
  maxAttempts = 18,
  requiredConsecutiveMatches = 3,
  intervalMs = 5000,
  sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
  onSample = () => {},
}) {
  if (!SHA_PATTERN.test(expectedSha ?? '')) {
    throw new Error('Expected the exact 40-character deployment SHA.');
  }
  if (typeof readVersion !== 'function') {
    throw new Error('A Marketing version reader is required.');
  }
  if (maxAttempts < 1 || requiredConsecutiveMatches < 1) {
    throw new Error('Marketing version attempts and stable-match count must be positive.');
  }

  let consecutiveMatches = 0;
  let lastSample = { ok: false, status: 0, commitSha: '', error: 'no version response' };

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      lastSample = await readVersion(attempt);
    } catch (error) {
      lastSample = {
        ok: false,
        status: 0,
        commitSha: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }

    if (lastSample.ok && lastSample.commitSha === expectedSha) {
      consecutiveMatches += 1;
    } else {
      consecutiveMatches = 0;
    }

    onSample({
      attempt,
      maxAttempts,
      consecutiveMatches,
      requiredConsecutiveMatches,
      sample: lastSample,
      description: describeSample(lastSample),
    });

    if (consecutiveMatches >= requiredConsecutiveMatches) {
      return { attempts: attempt, commitSha: expectedSha };
    }

    if (attempt < maxAttempts) await sleep(intervalMs);
  }

  throw new Error(
    `Live Marketing version did not converge to expected ${expectedSha} after ${maxAttempts} attempts; last response: ${describeSample(lastSample)}.`,
  );
}
