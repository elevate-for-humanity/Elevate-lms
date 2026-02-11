import { redirect } from 'next/navigation';

export default function CommunityHubCheckoutRedirect() {
  redirect('/store/licenses');
}
