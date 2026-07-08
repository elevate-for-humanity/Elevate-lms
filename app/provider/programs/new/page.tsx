import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Program | Provider',
};

export default function ProviderProgramsNewPage() {
  redirect('/provider');
}
