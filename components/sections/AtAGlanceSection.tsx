import { Clock, DollarSign, MapPin, GraduationCap } from 'lucide-react';

interface AtAGlanceSectionProps {
  duration?: string;
  cost?: string;
  format?: string;
  outcome?: string;
}

export function AtAGlanceSection({
  duration,
  cost,
  format,
  outcome,
}: AtAGlanceSectionProps) {
  const items = [
    { icon: Clock, label: 'Duration', value: duration },
    { icon: DollarSign, label: 'Cost', value: cost },
    { icon: MapPin, label: 'Format', value: format },
    { icon: GraduationCap, label: 'Outcome', value: outcome },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-3xl font-bold text-black mb-8">At-a-Glance</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-start gap-4">
                <Icon className="w-6 h-6 text-brand-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-black mb-1">{item.label}</h3>
                  <p className="text-black">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
