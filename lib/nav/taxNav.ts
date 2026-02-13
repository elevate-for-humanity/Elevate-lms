export type NavItem = { label: string; href: string };

export const taxNav = {
  label: 'Tax Services',
  href: '/tax',
  sections: [
    {
      title: 'Tax Preparation Services',
      items: [{ label: 'Overview', href: '/tax' }] as NavItem[],
    },
    {
      title: 'For-Profit (SupersonicFastCash)',
      items: [
        { label: 'Home', href: '/tax/supersonicfastcash' },
        { label: 'Services', href: '/tax/supersonicfastcash/services' },
        { label: 'Pricing', href: '/tax/supersonicfastcash/pricing' },
        {
          label: 'Upload Documents',
          href: '/tax/supersonicfastcash/documents',
        },
        { label: 'FAQ', href: '/tax/supersonicfastcash/faq' },
      ] as NavItem[],
    },
    {
      title: 'Free (Rise Up Foundation / VITA)',
      items: [
        { label: 'Home', href: '/tax/rise-up-foundation' },
        {
          label: 'Free Tax Help',
          href: '/tax/rise-up-foundation/free-tax-help',
        },
        { label: 'Volunteer', href: '/tax/rise-up-foundation/volunteer' },
        {
          label: 'Volunteer Training',
          href: '/tax/rise-up-foundation/training',
        },
        {
          label: 'Find a VITA Site',
          href: '/tax/rise-up-foundation/site-locator',
        },
        {
          label: 'Documents to Bring',
          href: '/tax/rise-up-foundation/documents',
        },
        { label: 'FAQ', href: '/tax/rise-up-foundation/faq' },
      ] as NavItem[],
    },
  ],
};
