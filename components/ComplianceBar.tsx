export function ComplianceBar() {
  return (
    <div className="bg-slate-100 border-t border-b border-slate-200 py-4 text-center text-sm">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center items-center gap-4">
        <span className="flex items-center gap-2">
          <span className="text-green-600 font-bold">•</span>
          <span className="font-medium">DOL Registered Apprenticeship</span>
        </span>
        <span className="hidden sm:inline text-slate-400">•</span>
        <span className="flex items-center gap-2">
          <span className="text-green-600 font-bold">•</span>
          <span className="font-medium">WIOA Eligible</span>
        </span>
        <span className="hidden sm:inline text-slate-400">•</span>
        <span className="flex items-center gap-2">
          <span className="text-green-600 font-bold">•</span>
          <span className="font-medium">State Workforce Approved</span>
        </span>
        <span className="hidden sm:inline text-slate-400">•</span>
        <span className="flex items-center gap-2">
          <span className="text-green-600 font-bold">•</span>
          <span className="font-medium">ETPL Licensed Provider</span>
        </span>
      </div>
    </div>
  );
}
