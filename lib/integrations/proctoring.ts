/**
 * Proctoring Integration
 */

export type ProctoringProvider = 'proctorio' | 'respondus' | 'honorlock';

interface ProctoringLaunchParams {
  provider: ProctoringProvider;
  examId: string;
  attemptId: string;
  studentId: string;
}

/**
 * Get proctoring launch URL for an exam attempt
 */
export function getProctoringLaunchUrl(params: ProctoringLaunchParams): string | null {
  const { provider, examId, attemptId, studentId } = params;

  switch (provider) {
    case 'proctorio':
      return `https://proctorio.com/launch?exam=${examId}&attempt=${attemptId}&student=${studentId}`;

    case 'respondus':
      return `https://respondus.com/lockdown/launch?exam=${examId}&attempt=${attemptId}&student=${studentId}`;

    case 'honorlock':
      return `https://honorlock.com/launch?exam=${examId}&attempt=${attemptId}&student=${studentId}`;

    default:
      return null;
  }
}

/**
 * Verify proctoring session
 */
export async function verifyProctoringSession(
  provider: ProctoringProvider,
  sessionId: string,
): Promise<boolean> {
  // A launch URL is not provider evidence. Fail closed until a signed provider
  // session/result adapter is configured; never certify an unverified attempt.
  return false;
}
