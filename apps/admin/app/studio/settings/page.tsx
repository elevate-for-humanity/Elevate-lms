import { Metadata } from 'next';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Settings | Dev Studio' };

export default function SettingsPage() {
  return <SettingsClient />;
}
