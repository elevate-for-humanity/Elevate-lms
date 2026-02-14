import { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color?: string;
}

interface ModernFeaturesProps {
  title: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
}

export default function ModernFeatures({
  title,
  subtitle,
  features,
  columns = 3,
}: ModernFeaturesProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-black mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xl text-black max-w-3xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`grid ${gridCols[columns]} gap-8`}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colorClass = feature.color || 'blue';
            
            return (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-brand-blue-200 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-16 h-16 bg-${colorClass}-100 rounded-xl flex items-center justify-center mb-6`}>
                  <Icon className={`w-8 h-8 text-${colorClass}-600`} />
                </div>
                <h3 className="text-xl font-bold text-black mb-3">
                  {feature.title}
                </h3>
                <p className="text-black leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
