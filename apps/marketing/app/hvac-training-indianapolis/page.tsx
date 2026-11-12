import {
  IndianapolisProgramHubPage,
  indianapolisHubMetadata,
} from '@/components/seo/IndianapolisProgramHubPage';
import { HVAC_TRAINING_INDIANAPOLIS } from '@/data/seo/indianapolis-program-hubs';

export const dynamic = 'force-static';

export const metadata = indianapolisHubMetadata(HVAC_TRAINING_INDIANAPOLIS);

export default function HvacTrainingIndianapolisPage() {
  return <IndianapolisProgramHubPage config={HVAC_TRAINING_INDIANAPOLIS} />;
}
