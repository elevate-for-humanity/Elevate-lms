import type { Metadata } from 'next';
import SettingsClient from './SettingsClient';

export const metadata: Metadata = {
  title: 'Account Settings | Elevate for Humanity',
  description: 'Manage your account settings and preferences.',
};

export default function SettingsPage() {
  return <SettingsClient />;
}