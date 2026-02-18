import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

// Safety net redirect for legacy /shop/product/* URLs
// Primary redirect handled by Netlify edge, this catches local dev and edge cases
export default async function LegacyShopProductRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/store/products/${encodeURIComponent(slug)}`);
}
