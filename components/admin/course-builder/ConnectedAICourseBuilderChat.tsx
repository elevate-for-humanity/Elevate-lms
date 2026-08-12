'use client';

import { useEffect, useState } from 'react';
import AICourseBuilderChat from './AICourseBuilderChat';

type Program = { id: string; title: string; slug?: string };

export default function ConnectedAICourseBuilderChat() {
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    fetch('/api/admin/programs', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.programs)
            ? data.programs
            : Array.isArray(data?.data)
              ? data.data
              : [];
        setPrograms(
          rows.map((row: any) => ({
            id: row.id,
            title: row.title ?? row.name ?? 'Untitled program',
            slug: row.slug,
          })),
        );
      })
      .catch(() => setPrograms([]));
  }, []);

  return <AICourseBuilderChat programs={programs} />;
}
