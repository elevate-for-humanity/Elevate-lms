/** Public IRS Publication 5446 and TY2026 Publication 1436 constraints. */
export function createSubmissionId(input: {
  efin: string;
  processingYear: number;
  julianDay: number;
  sequence: number;
}): string {
  if (!/^\d{6}$/.test(input.efin)) throw new Error('EFIN must contain six digits');
  if (!Number.isInteger(input.processingYear) || input.processingYear < 2000 || input.processingYear > 9999) throw new Error('A valid processing year is required');
  const leap = input.processingYear % 4 === 0 && (input.processingYear % 100 !== 0 || input.processingYear % 400 === 0);
  if (!Number.isInteger(input.julianDay) || input.julianDay < 1 || input.julianDay > (leap ? 366 : 365)) throw new Error('Invalid Julian day');
  if (!Number.isInteger(input.sequence) || input.sequence < 0 || input.sequence > 9999999) throw new Error('Sequence must be between 0 and 9999999');
  return input.efin + input.processingYear + String(input.julianDay).padStart(3, '0') + String(input.sequence).padStart(7, '0');
}

export function validateAtsSsn(value: string): boolean {
  return /^(?:\d{3}00\d{4}|\d{3}-00-\d{4})$/.test(value);
}

export function validatePractitionerSignature(input: {
  efin: string;
  taxpayerPin: string;
  practitionerPin: string;
  signedDate: string;
  authorizationRecorded: boolean;
}): string[] {
  const errors: string[] = [];
  if (!/^\d{6}$/.test(input.efin)) errors.push('EFIN must contain six digits');
  if (!/^\d{5}$/.test(input.taxpayerPin) || input.taxpayerPin === '00000') errors.push('Taxpayer PIN must be five digits and cannot be all zeros');
  if (!/^\d{11}$/.test(input.practitionerPin) || !input.practitionerPin.startsWith(input.efin) || input.practitionerPin.slice(6) === '00000') errors.push('Practitioner PIN must contain the EFIN followed by a nonzero five-digit PIN');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.signedDate) || !Number.isFinite(Date.parse(input.signedDate)) || new Date(input.signedDate).toISOString().slice(0, 10) !== input.signedDate) errors.push('A valid signature date is required');
  if (!input.authorizationRecorded) errors.push('Taxpayer authorization must be recorded');
  return errors;
}
