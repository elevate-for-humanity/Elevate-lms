export interface AccessibilityEvidence {
  captions: boolean;
  transcript: boolean;
  altText: boolean;
  keyboardOperation: boolean;
  focusOrder: boolean;
  semanticHeadings: boolean;
  colorContrast: boolean;
  nonColorMeaning: boolean;
  screenReaderLabels: boolean;
  reducedMotion: boolean;
  accessibleInteractionFallback: boolean;
  contractVersion?: string;
}
export function evaluateAccessibility(e: AccessibilityEvidence) {
  // The signed browser envelope verifies contractVersion before this stage.
  // It is metadata, never a boolean accessibility observation.
  const checks = Object.entries(e).filter(([key]) => key !== 'contractVersion');
  const failures = checks.filter(([, value]) => value !== true)
    .map(([key]) => `ACCESSIBILITY_${key.toUpperCase()}_FAILED`);
  if (!checks.length) failures.push('ACCESSIBILITY_EVIDENCE_REQUIRED');
  return { pass: failures.length === 0, critical: failures.length > 0, failures };
}
