type ProgressStepsProps = {
  current?: 1 | 2 | 3;
};

const steps = [
  'Tell us about you',
  'We review your fit',
  'We guide funding + enrollment',
];

export default function ProgressSteps({ current = 1 }: ProgressStepsProps) {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {steps.map((label, i) => {
          const stepNumber = (i + 1) as 1 | 2 | 3;
          const isActive = stepNumber === current;
          const isComplete = stepNumber < current;

          return (
            <div
              key={label}
              className={`rounded-2xl border p-4 ${
                isActive
                  ? 'border-brand-blue-600 bg-brand-blue-600 text-white'
                  : isComplete
                  ? 'border-brand-blue-200 bg-brand-blue-50 text-brand-blue-800'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              <div className="text-sm font-medium">Step {stepNumber}</div>
              <div className="mt-1 text-base">{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
