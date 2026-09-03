export function getOptimizedImageUrl(src: string, width: number, quality: number = 75): string {
  // For external images, use Next.js Image Optimization API
  if (src.startsWith('http')) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
  }

  // For local images, return as-is (Next.js will optimize)
  return src;
}

export function getImageSrcSet(src: string, sizes: number[]): string {
  return sizes.map((size) => `${getOptimizedImageUrl(src, size)} ${size}w`).join(', ');
}

export function getResponsiveSizes(breakpoints: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
}): string {
  const { mobile = '100vw', tablet = '50vw', desktop = '33vw' } = breakpoints;
  return `(max-width: 640px) ${mobile}, (max-width: 1024px) ${tablet}, ${desktop}`;
}
