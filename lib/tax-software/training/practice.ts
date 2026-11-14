export const practiceCases = [
  {
    title: 'Case A — W-2 intake',
    name: 'Alex Example',
    documents: [
      [
        'Mock intake',
        'TY2026; Single (verify eligibility); TRAINING-ID-A. Intake lists two employers; only one W-2 is supplied.',
      ],
      [
        'Mock W-2',
        'Example Training Company. Box 1: $40,000; Box 2: $3,200; Box 3: $40,000; Box 4: $2,480; Box 5: $40,000; Box 6: $580.',
      ],
    ],
    tasks: [
      'Identify the missing W-2; do not treat the return as complete.',
      'Confirm every supplied field against the mock source.',
      'A corrected Box 1 of $41,000 arrives: recalculate and repeat the affected review.',
    ],
    key: 'The first return cannot be finalized with an identified missing income document. A correction invalidates the affected estimate and review.',
  },
  {
    title: 'Case B — Business income',
    name: 'Jordan Sample',
    documents: [
      [
        'Mock 1099-NEC',
        'TY2026; Example Services; Box 1: $28,000; withholding: $0. No real taxpayer or payer ID.',
      ],
      [
        'Mock business ledger',
        'Gross receipts $32,000 INCLUDING the 1099. Supplies $2,000; advertising $500; insurance $800. Single-owner service business.',
      ],
    ],
    tasks: [
      'Reconcile the 1099 to the ledger without counting it twice.',
      'Calculate listed expenses and worksheet profit.',
      'Confirm expense eligibility with a supervisor before production use.',
    ],
    key: 'Receipts: $32,000, not $60,000. Listed expenses: $3,300. Worksheet profit before other adjustments: $28,700. Tax liability requires a complete return.',
  },
  {
    title: 'Case C — Fees and a rejection',
    name: 'Taylor Fiction',
    documents: [
      [
        'Mock checkout — invented fees',
        'Estimated refund $1,000; preparation fee $100; invented bank fee $40 (NOT an EPS quote). Training account label only; no bank digits.',
      ],
      [
        'Mock acknowledgment',
        'TRAIN-NAME-MISMATCH. Fictional rejected status; not a real IRS rejection code.',
      ],
    ],
    tasks: [
      'Calculate the illustrative remainder and explain that funding is not guaranteed.',
      'Keep a Refund Transfer separate from an optional advance loan.',
      'Record rejection, investigate the identity discrepancy, and obtain updated authorization when required.',
    ],
    key: 'Illustrative remainder: $860 before other offsets. A rejection is not acceptance; correction and resubmission must be tracked separately.',
  },
] as const;
