import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  HVAC_PROGRAM_HOLDER_REQUIRED_DOCUMENTS,
  requiredProgramHolderDocuments,
} from '@/lib/program-holder/onboarding-readiness';

describe('HVAC Program Holder onboarding contract', () => {
  it('requires the payment and compliance document set', () => {
    expect(HVAC_PROGRAM_HOLDER_REQUIRED_DOCUMENTS.map((item) => item.type)).toEqual([
      'government_id',
      'business_registration',
      'insurance',
      'epa_608',
      'w9',
      'hvac_training_plan',
      'profile_photo',
    ]);
  });

  it('requires student media only when the Program Holder enables that feature', () => {
    expect(requiredProgramHolderDocuments(true).map((item) => item.type)).not.toContain(
      'student_photo',
    );
    expect(
      requiredProgramHolderDocuments(true, { student_media_required: true }).map(
        (item) => item.type,
      ),
    ).toEqual([
      ...HVAC_PROGRAM_HOLDER_REQUIRED_DOCUMENTS.map((item) => item.type),
      'student_photo',
      'student_video',
    ]);
  });

  it('keeps applicants unassigned while routing enrolled learners', () => {
    const migration = readFileSync('supabase/migrations/20260903000001_program_holder_enrollment_and_payment_gates.sql', 'utf8');
    expect(migration).toContain("not in ('active', 'enrolled', 'completed', 'graduated')");
    expect(migration).toContain('new.program_holder_id := null');
  });

  it('uses the assigned Program Holder record and activates it after signature', () => {
    const page = readFileSync('apps/lms/app/program-holder/sign-mou/page.tsx', 'utf8');
    const action = readFileSync('apps/marketing/app/actions/sign-agreement.ts', 'utf8');
    expect(page).toContain("agreementVersion={packet ? achieveDocumentVersion('mou', packet.digest) : `3.0-${holder.id}`}");
    expect(action).toContain('data.agreementVersion !== `3.0-${holderId}`');
    expect(page).toContain('{holder.organization_name}');
    expect(page).toContain("from('program_holder_programs')");
    expect(page).not.toContain('INDY ON DEMAND SERVICES LLC');
    expect(action).toContain("mou_status: 'signed'");
  });
});
