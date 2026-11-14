export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-16 w-16' : 'h-10 w-10';

  return (
    <div className="flex items-center justify-center py-12">
      <div
        className={`${sizeClass} animate-spin rounded-full border-3 border-accent-500 border-t-transparent`}
      />
    </div>
  );
}
