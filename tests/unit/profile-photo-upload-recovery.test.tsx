import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { UniversalProfilePhotoEditor } from '@/components/profile/UniversalProfilePhotoEditor';
const upload = vi.hoisted(() => vi.fn());
vi.mock('@/lib/profile/avatar-actions', () => ({
  uploadProfileAvatar: upload,
  getImageReleaseStatus: async () => ({ consent: null }),
  revokeImageRelease: vi.fn(),
  signImageRelease: vi.fn(),
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

describe('profile photo upload recovery', () => {
  it('shows an error and allows retry when the server action rejects', async () => {
    upload.mockRejectedValue(new Error('transport rejected'));
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:photo-preview', revokeObjectURL: vi.fn() });
    render(<UniversalProfilePhotoEditor name="Learner" />);
    await waitFor(() => expect(screen.queryByText('Loading release status…')).not.toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Choose photo'), {
      target: { files: [new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save photo' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save photo' })).toBeEnabled());
    expect(screen.getByText(/Photo upload could not finish/)).toBeInTheDocument();
    expect(upload).toHaveBeenCalledOnce();
  });
});
