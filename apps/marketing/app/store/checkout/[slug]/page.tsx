import { redirect } from 'next/navigation';
export default async function StoreCheckoutBridge({params}:{params:Promise<{slug:string}>}){const {slug}=await params;redirect(`/store/cart?add=${encodeURIComponent(slug)}`);}
