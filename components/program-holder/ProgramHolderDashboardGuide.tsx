'use client';
import VisualDashboardOrientation, {type OrientationAudience} from '@/components/orientation/VisualDashboardOrientation';

export function ProgramHolderDashboardGuide({audience='program-holder'}:{audience?:OrientationAudience}) {
  return <VisualDashboardOrientation audience={audience} compact />;
}
