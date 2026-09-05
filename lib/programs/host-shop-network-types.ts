export type HostShopNetworkEntry = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  address: string;
  phone?: string;
  programs: string[];
  description: string;
  image?: string;
  website?: string;
  social?: string;
  booking?: string;
  approval: 'approved' | 'published-partner';
};
