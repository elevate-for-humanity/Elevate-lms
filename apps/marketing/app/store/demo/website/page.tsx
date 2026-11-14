import { redirect } from 'next/navigation';

/** Keep the legacy website demo URL mapped to a dedicated capability preview,
 * rather than returning visitors to the store sales section. */
export default function StoreWebsiteDemoCompatibilityPage() {
  redirect('/store/demo/capability/website_builder');
}
