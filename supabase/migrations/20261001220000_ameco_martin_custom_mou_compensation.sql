-- Ameco's Enterprise LLC / Amiko Martin custom Program Holder MOU.
-- Compensation is $1,000 per attributable participant: $500 after verified
-- program start and $500 after documented program completion.
-- Preserve all unrelated Program Holder feature configuration.

update public.program_holders
set
  mou_type = 'custom',
  features = coalesce(features, '{}'::jsonb) || jsonb_build_object(
    'custom_mou',
    jsonb_build_object(
      'version', '2026-10-ameco-technology-01',
      'compensation_per_participant', 1000,
      'initial_payment', 500,
      'initial_payment_trigger', 'verified_program_start',
      'completion_payment', 500,
      'completion_payment_trigger', 'documented_program_completion',
      'participant_attribution_required', true,
      'non_compete_required', true,
      'confidentiality_required', true,
      'requirements', jsonb_build_array(
        'Participant must be attributable to Ameco''s Enterprise / Amiko Martin in the system.',
        'First $500 becomes payable only after the participant has a verified start in the assigned program.',
        'Final $500 becomes payable only after documented program completion.',
        'Program Holder must complete the required non-compete and confidentiality acknowledgements.',
        'Duplicate, cancelled, withdrawn, or unverified participants do not independently trigger payment.'
      )
    )
  ),
  updated_at = now()
where lower(coalesce(organization_name, name, '')) in (
  'ameco''s enterprise',
  'ameco''s enterprise llc'
)
   or lower(coalesce(contact_name, '')) in ('amiko martin', 'ameco martin');

comment on column public.program_holders.features is
'Program Holder role-scoped configuration. custom_mou may contain participant compensation triggers and required agreement acknowledgements.';
