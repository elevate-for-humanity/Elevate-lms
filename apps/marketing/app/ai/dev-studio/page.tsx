import { permanentRedirect } from 'next/navigation';

/**
 * Compatibility route.
 * The canonical public Dev Studio product page lives at `/dev-studio`.
 * Keep this route to preserve existing inbound links while eliminating
 * a second copy of the same marketing content.
 */
export default function DevStudioAiCompatibilityRoute() {
  permanentRedirect('/platform');
}
