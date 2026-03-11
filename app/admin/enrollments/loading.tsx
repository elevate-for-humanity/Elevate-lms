export default function AdminLoading() {
  return (
    <div className="p-6 space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 animate-pulse rounded-lg" />
      ))}
    </div>
  );
}
