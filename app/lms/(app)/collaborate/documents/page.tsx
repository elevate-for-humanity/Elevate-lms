'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CollaborationProvider } from '@/lib/collaboration/yjs-provider';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FileText, Users, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SharedDocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const providerRef = useRef<CollaborationProvider | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      setLoading(false);

      // Fetch shared documents
      supabase
        .from('shared_documents')
        .select('*')
        .or(`owner_id.eq.${u.id},collaborators.cs.{${u.id}}`)
        .order('updated_at', { ascending: false })
        .then(({ data }) => setDocuments(data || []));
    });

    return () => { providerRef.current?.destroy(); };
  }, [router]);

  const openDocument = (docId: string) => {
    if (!user) return;
    providerRef.current?.destroy();

    const provider = new CollaborationProvider({
      documentId: docId,
      userId: user.id,
      userName: user.email || 'Anonymous',
    });

    providerRef.current = provider;
    setActiveDoc(docId);

    // Sync content from Yjs shared type
    const sharedText = provider.getSharedType('content');
    setContent(sharedText.toString());
    sharedText.observe(() => setContent(sharedText.toString()));

    // Track collaborators
    provider.onAwarenessChange((states: Map<number, any>) => {
      const names: string[] = [];
      states.forEach((state) => {
        if (state.user?.name) names.push(state.user.name);
      });
      setCollaborators(names);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'LMS', href: '/lms/dashboard' },
          { label: 'Collaborate', href: '/lms/collaborate' },
          { label: 'Shared Documents' },
        ]} />

        <div className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Shared Documents</h1>
            <Link
              href="/lms/collaborate"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Collaborate
            </Link>
          </div>

          {activeDoc ? (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-brand-blue-600" />
                  <span className="font-medium">Document</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{collaborators.length} online</span>
                  </div>
                  <button
                    onClick={() => { providerRef.current?.destroy(); setActiveDoc(null); }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="p-6">
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    const sharedText = providerRef.current?.getSharedType('content');
                    if (sharedText) {
                      sharedText.delete(0, sharedText.length);
                      sharedText.insert(0, e.target.value);
                    }
                  }}
                  className="w-full h-96 p-4 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="Start typing... Changes sync in real-time with collaborators."
                  aria-label="Shared document editor"
                />
              </div>
              {collaborators.length > 0 && (
                <div className="px-6 pb-4">
                  <p className="text-xs text-gray-500">
                    Collaborating with: {collaborators.join(', ')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.length > 0 ? documents.map((doc: any) => (
                <button
                  key={doc.id}
                  onClick={() => openDocument(doc.id)}
                  className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition text-left"
                >
                  <FileText className="w-8 h-8 text-brand-blue-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">{doc.title || 'Untitled'}</h3>
                  <p className="text-sm text-gray-500">
                    Last edited {new Date(doc.updated_at).toLocaleDateString()}
                  </p>
                </button>
              )) : (
                <div className="col-span-full bg-white rounded-xl p-12 text-center border">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">No shared documents yet</h2>
                  <p className="text-gray-600">Documents shared with you will appear here.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
