import { createRoot } from 'react-dom/client';
import { EmailWorkspace } from '@/components/communications/EmailWorkspace';
import './style.css';

const params = new URLSearchParams(location.search);
createRoot(document.getElementById('root')!).render(
  <EmailWorkspace
    initialMailboxId={params.get('mailboxId') || undefined}
    initialThreadId={params.get('threadId') || undefined}
    roleLabel="Admin"
  />,
);
