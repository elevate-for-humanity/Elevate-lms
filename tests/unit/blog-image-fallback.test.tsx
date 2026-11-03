import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import BlogImage from '../../components/blog/BlogImage';
import { BLOG_IMAGE_FALLBACK } from '../../lib/blog/images';

vi.mock('next/image', () => ({ default: ({src,alt,onError}: React.ImgHTMLAttributes<HTMLImageElement>) =>
  <img src={src} alt={alt} onError={onError} /> }));
afterEach(cleanup);

it('shows local artwork when an article image fails and tries the next article’s own image', () => {
  const {rerender}=render(<BlogImage src="/unavailable.webp" alt="Training" width={320} height={180}/>);
  const image=screen.getByAltText('Training');
  fireEvent.error(image);
  expect(image.getAttribute('src')).toBe(BLOG_IMAGE_FALLBACK);
  rerender(<BlogImage src="/working.webp" alt="Training" width={320} height={180}/>);
  expect(image.getAttribute('src')).toBe('/working.webp');
});
