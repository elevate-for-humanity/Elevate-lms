import React from 'react';
import type { Metadata } from 'next';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your purchase.',
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
