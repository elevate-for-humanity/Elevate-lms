import 'server-only';

import { NextResponse } from 'next/server';

export function oneRosterUnauthorized(): NextResponse {
  return NextResponse.json(
    {
      imsx_codeMajor: 'failure',
      imsx_severity: 'error',
      imsx_codeMinor: { imsx_codeMinorField: [{ imsx_codeMinorFieldName: 'sourcedId', imsx_codeMinorFieldValue: 'unauthorized' }] },
    },
    { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="Elevate OneRoster"' } },
  );
}

export function oneRosterUnavailable(): NextResponse {
  return NextResponse.json(
    { error: 'OneRoster is disabled until the Edlink connection is approved.' },
    { status: 503 },
  );
}

export function oneRosterError(message = 'Unable to read roster data'): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function oneRosterStatus(status: string | null | undefined): 'active' | 'tobedeleted' {
  return status === 'cancelled' || status === 'withdrawn' ? 'tobedeleted' : 'active';
}

export function dateLastModified(value: string | null | undefined): string {
  return value || new Date(0).toISOString();
}

