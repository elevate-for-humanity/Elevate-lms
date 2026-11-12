import {
  IndianapolisProgramHubPage,
  indianapolisHubMetadata,
} from '@/components/seo/IndianapolisProgramHubPage';
import { CDL_TRAINING_INDIANAPOLIS } from '@/data/seo/indianapolis-program-hubs';

export const dynamic = 'force-static';

export const metadata = indianapolisHubMetadata(CDL_TRAINING_INDIANAPOLIS);

export default function CdlTrainingIndianapolisPage() {
  return <IndianapolisProgramHubPage config={CDL_TRAINING_INDIANAPOLIS} />;
}
