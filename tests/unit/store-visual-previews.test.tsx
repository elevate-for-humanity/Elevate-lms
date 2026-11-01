import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import InlineStoreDemo from '@/components/store/InlineStoreDemo';
import WorkbookPreview from '@/components/store/WorkbookPreview';
vi.mock('next/image', () => ({
  default: ({
    fill,
    priority,
    ...props
  }: {
    fill?: boolean;
    priority?: boolean;
    src: string;
    alt: string;
  }) => <img {...props} />,
}));
vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock('@/components/programs/NarratedProgramIntro', () => ({
  ProgramNarration: () => <div>Audio controls</div>,
}));
afterEach(cleanup);
describe('Store visual previews', () => {
  it('loads the product-specific demo only after Play and releases it on Close', () => {
    const view = render(<InlineStoreDemo name="Solo plan" href="/store/demo/plan/solo" />);
    expect(view.container.querySelector('iframe')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Play Solo plan demo' }));
    expect(screen.getByTitle('Solo plan interactive demonstration')).toHaveAttribute(
      'src',
      '/store/demo/plan/solo',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close demo' }));
    expect(view.container.querySelector('iframe')).toBeNull();
  });
  it('retains workbook preview notes when moving between activities', () => {
    render(<WorkbookPreview subject="Barbering" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open workbook preview' }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Discuss clipper technique with my trainer.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('textbox')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('textbox')).toHaveValue('Discuss clipper technique with my trainer.');
    expect(screen.getByText(/not saved to your account/)).toBeInTheDocument();
  });
});
