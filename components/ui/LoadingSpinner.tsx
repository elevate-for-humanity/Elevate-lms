export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-11 w-11 border-2',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-b-brand-orange-600 ${sizeClasses[size]}`} />
    </div>
  );
}
