import { permanentRedirect } from 'next/navigation';

/**
 * Historical training index. The canonical program catalog owns current program,
 * credential, duration, tuition, and funding disclosures so duplicate marketing
 * copy cannot drift from controlling records.
 */
export default function TrainingPage() {
  permanentRedirect('/programs');
}
