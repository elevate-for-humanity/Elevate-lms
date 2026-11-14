import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { BeforePublishModal } from '@/components/dev-studio/live-canvas/BeforePublishModal';
it('shows an unavailable state without invented scores or a publish action', () => {
  const html = renderToStaticMarkup(<BeforePublishModal isOpen onClose={() => {}} onPublish={() => { throw new Error('must not publish'); }} />);
  expect(html).toContain('Publish verification unavailable');
  expect(html).not.toContain('Development Build #42');
  expect(html).not.toContain('Ready to Publish');
  expect(html.match(/<button/g)).toHaveLength(1);
});
