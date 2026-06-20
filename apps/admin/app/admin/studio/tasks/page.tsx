import { Metadata } from 'next';
import TasksClient from './TasksClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'AI Tasks | Dev Studio' };

export default function TasksPage() {
  return <TasksClient />;
}
