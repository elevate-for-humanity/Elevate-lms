
interface Step {
  number: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface HowItWorksProps {
  steps: Step[];
  variant?: 'horizontal' | 'vertical';
}

export function HowItWorks({ steps, variant = 'horizontal' }: HowItWorksProps) {
  if (variant === 'vertical') {
    return (
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.number} className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-white text-white flex items-center justify-center font-bold text-lg">
                {step.number}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-black mb-2">{step.title}</h3>
              <p className="text-black">{step.description}</p>
            </div>
            {step.icon && (
              <div className="flex-shrink-0 text-brand-blue-600">
                {step.icon}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {steps.map((step, index) => (
        <div key={step.number} className="relative">
          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className="hidden md:block absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-0.5 bg-brand-blue-200" />
          )}

          <div className="relative bg-white rounded-lg p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-white text-white flex items-center justify-center font-bold text-lg mx-auto mb-4 relative z-10">
              {step.number}
            </div>
            {step.icon && (
              <div className="text-brand-blue-600 flex justify-center mb-3">
                {step.icon}
              </div>
            )}
            <h3 className="text-lg font-bold text-black mb-2">{step.title}</h3>
            <p className="text-sm text-black">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
