import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import CosmetologyPartnerPageClient from './PartnerPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Cosmetology Host Shop Program',
	description:
		'Become a host salon partner for the Indiana cosmetology apprenticeship pathway. Apply, complete onboarding, and host apprentices at your shop.',
	alternates: {
		canonical: 'https://www.elevateforhumanity.org/partners/cosmetology-host-shop',
	},
	openGraph: {
		title: 'Cosmetology Host Shop Program',
		description: 'Host apprentices and grow your salon with structured training support.',
		url: 'https://www.elevateforhumanity.org/partners/cosmetology-host-shop',
	},
};

export default async function CosmetologyPartnerShopPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	let isApproved = false;
	if (user?.email) {
		const { data: pa } = await supabase
			.from('partner_applications')
			.select('status')
			.eq('contact_email', user.email)
			.eq('status', 'approved')
			.maybeSingle();
		isApproved = !!pa;
	}

	return (
		<CosmetologyPartnerPageClient
			isApproved={isApproved}
			basePath="/partners/cosmetology-host-shop"
			breadcrumbLabel="Cosmetology Host Shop"
		/>
	);
}
