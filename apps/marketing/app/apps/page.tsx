import { permanentRedirect } from 'next/navigation';

/**
 * Public app catalog alias.
 *
 * Individual app workspaces continue to live under /apps/<app>, but the root
 * catalog belongs under /store/apps. This avoids exposing fake static account
 * status and gives search engines one canonical commercial catalog.
 */
export default function AppsPage() {
  permanentRedirect('/store/apps');
}
