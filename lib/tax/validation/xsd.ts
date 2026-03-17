import { execFileSync } from 'node:child_process';
import { access, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export type XsdValidationIssue = {
  code: string;
  message: string;
  path?: string;
  severity: 'error' | 'warning';
};

/**
 * Validate XML against an IRS XSD schema using xmllint.
 *
 * Hard-fails if:
 *   - schema file is missing (SCHEMA_MISSING)
 *   - xmllint is not installed (XMLLINT_NOT_AVAILABLE)
 *   - XML fails schema validation (XSD_VALIDATION_FAILED / XSD_*)
 *
 * Never silently downgrades to structural-only validation.
 */
export async function validateXmlAgainstXsd(input: {
  xml: string;
  schemaPath: string;
}): Promise<XsdValidationIssue[]> {
  // Confirm schema exists before attempting validation
  try {
    await access(input.schemaPath);
  } catch {
    return [{
      code: 'SCHEMA_MISSING',
      message: `IRS XSD schema not found: ${input.schemaPath}. Download from IRS e-Services → MeF → Software Developer Resources.`,
      severity: 'error',
    }];
  }

  // Confirm xmllint is available
  try {
    execFileSync('xmllint', ['--version'], { stdio: 'ignore' });
  } catch {
    return [{
      code: 'XMLLINT_NOT_AVAILABLE',
      message: 'xmllint is not installed. Install libxml2-utils to enable XSD validation.',
      severity: 'error',
    }];
  }

  // Write XML to temp file for xmllint
  const tmpFile = path.join(os.tmpdir(), `xsd-validate-${Date.now()}-${Math.random().toString(36).slice(2)}.xml`);
  try {
    await writeFile(tmpFile, input.xml, 'utf-8');

    try {
      execFileSync('xmllint', ['--noout', '--schema', input.schemaPath, tmpFile], {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30000,
      });
      return []; // exit 0 = valid
    } catch (err) {
      const stderr = err && typeof err === 'object' && 'stderr' in err
        ? String((err as { stderr?: unknown }).stderr ?? '')
        : 'xmllint exited with errors';

      return parseXmllintOutput(stderr);
    }
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

function parseXmllintOutput(stderr: string): XsdValidationIssue[] {
  const issues: XsdValidationIssue[] = [];
  const lines = stderr.split('\n').filter(l =>
    l.trim() && !l.includes('fails to validate') && !l.includes(' validates')
  );

  for (const line of lines) {
    const isWarning = line.toLowerCase().includes('warning');
    const msgMatch = line.match(/:\s*(.+)$/);
    const message = msgMatch ? msgMatch[1].trim() : line.trim();

    let code = 'XSD_VALIDATION_ERROR';
    if (message.includes('Missing child element')) code = 'XSD_MISSING_ELEMENT';
    else if (message.includes('not expected')) code = 'XSD_UNEXPECTED_ELEMENT';
    else if (message.includes('not a valid value')) code = 'XSD_INVALID_VALUE';
    else if (message.includes('cardinality')) code = 'XSD_CARDINALITY';
    else if (message.includes('namespace')) code = 'XSD_NAMESPACE';

    issues.push({ code, message, severity: isWarning ? 'warning' : 'error' });
  }

  if (issues.length === 0) {
    issues.push({
      code: 'XSD_VALIDATION_FAILED',
      message: stderr.trim() || 'xmllint failed with no parseable output',
      severity: 'error',
    });
  }

  return issues;
}
