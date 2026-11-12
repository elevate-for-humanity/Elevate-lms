import {
  IndianapolisProgramHubPage,
  indianapolisHubMetadata,
} from '@/components/seo/IndianapolisProgramHubPage';
import { CNA_TRAINING_INDIANAPOLIS } from '@/data/seo/indianapolis-program-hubs';

export const dynamic = 'force-static';

export const metadata = indianapolisHubMetadata(CNA_TRAINING_INDIANAPOLIS);

export default function CnaTrainingIndianapolisPage() {
  return <IndianapolisProgramHubPage config={CNA_TRAINING_INDIANAPOLIS} />;
}
