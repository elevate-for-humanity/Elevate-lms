import { Clock, MapPin, Monitor, Users, DollarSign, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface ProgramGlanceProps {
  duration: string;
  location: string;
  modality: 'online' | 'in-person' | 'hybrid';
  prerequisites: string;
  fundingOptions: string[];
  nextSteps: string;
}

export function ProgramGlance({
  duration,
  location,
  modality,
  prerequisites,
  fundingOptions,
  nextSteps,
}: ProgramGlanceProps) {
  return (
    <Card variant="elevated" className="sticky top-24">
      <h3 className="text-2xl font-bold text-black mb-6">At a Glance</h3>

      <div className="space-y-4">
        {/* Duration */}
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-1" />
          <div>
            <div className="font-semibold text-black">Duration</div>
            <div className="text-black">{duration}</div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-1" />
          <div>
            <div className="font-semibold text-black">Location</div>
            <div className="text-black">{location}</div>
          </div>
        </div>

        {/* Modality */}
        <div className="flex items-start gap-3">
          <Monitor className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-1" />
          <div>
            <div className="font-semibold text-black">Format</div>
            <div className="mt-1">
              <Badge type={modality} />
            </div>
          </div>
        </div>

        {/* Prerequisites */}
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-1" />
          <div>
            <div className="font-semibold text-black">Prerequisites</div>
            <div className="text-black">{prerequisites}</div>
          </div>
        </div>

        {/* Funding */}
        <div className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-1" />
          <div>
            <div className="font-semibold text-black">Funding Options</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {fundingOptions.map((option) => (
                <Badge key={option} type={option as any} size="sm" />
              ))}
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="pt-4 border-t border-gray-200">
          <div className="font-semibold text-black mb-2">Next Steps</div>
          <div className="text-black mb-4">{nextSteps}</div>
          <div className="flex flex-col gap-2">
            <a
              href="/apply"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              Apply Now
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-brand-blue-600 border-2 border-brand-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Talk to an Advisor
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
