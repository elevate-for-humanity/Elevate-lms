import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="text-center p-6">
      <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <div className="text-brand-blue-600">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold text-black mb-2">{title}</h3>
      <p className="text-black">{description}</p>
    </div>
  );
}
