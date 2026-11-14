'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { BLOG_IMAGE_FALLBACK } from '@/lib/blog/images';

export default function BlogImage({ src, alt, ...props }: Omit<ImageProps, 'src' | 'onError'> & { src: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const image = failedSource === src ? BLOG_IMAGE_FALLBACK : src;
  return <Image {...props} src={image} alt={alt}
    onError={() => { if (image !== BLOG_IMAGE_FALLBACK) setFailedSource(src); }} />;
}
