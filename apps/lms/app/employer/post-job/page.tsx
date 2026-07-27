import type { Metadata } from 'next';
import PostJobClient from './PostJobClient';

export const metadata: Metadata = {
  title: 'Post a Job | Elevate for Humanity',
  description: 'Post job openings to connect with trained Elevate graduates.',
};

export default function PostJobPage() {
  return <PostJobClient />;
}