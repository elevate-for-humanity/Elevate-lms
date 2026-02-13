import { redirect } from 'next/navigation';

// Deployment/hosting is part of managed licensing
export default function DeploymentRedirect() {
  redirect('/store/licenses');
}
