import type { ProgramCredential } from '@/lib/programs/program-schema';

/** Credential card subtitle: issuer + industry recognition line. */
export function formatCredentialAuthorityLine(credential: ProgramCredential): string {
  const body = credential.issuingBody ?? credential.issuer;
  return `Issued by ${body} — nationally recognized in this field`;
}
