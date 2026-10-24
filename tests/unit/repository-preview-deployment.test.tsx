/** @vitest-environment-options {"url":"https://paris-acceptance.example.test/studio/repository"} */
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import RepositoryLivePreview from '@/components/studio/RepositoryLivePreview';
afterEach(cleanup);
it('keeps inferred Admin routes in the active deployment with an interactive preview', async () => {
 const { container } = render(<RepositoryLivePreview filePath="apps/admin/app/studio/courses/page.tsx" content="" />);
 await waitFor(() => expect(container.querySelector('iframe')?.getAttribute('src')).toBe(window.location.origin + '/studio/courses'));
 expect(container.querySelector('iframe')?.getAttribute('sandbox')).toContain('allow-same-origin');
});
it('preserves explicitly requested external previews', async () => {
 const { container } = render(<RepositoryLivePreview filePath={null} content="" initialUrl="https://example.org/preview" />);
 await waitFor(() => expect(container.querySelector('iframe')?.getAttribute('src')).toBe('https://example.org/preview'));
 expect(container.querySelector('iframe')?.getAttribute('sandbox')).toBe('');
});
