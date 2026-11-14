import {
  IndianapolisProgramHubPage,
  indianapolisHubMetadata,
} from '@/components/seo/IndianapolisProgramHubPage';
import { BARBER_APPRENTICESHIP_INDIANAPOLIS } from '@/data/seo/indianapolis-program-hubs';

export const dynamic = 'force-static';

export const metadata = indianapolisHubMetadata(BARBER_APPRENTICESHIP_INDIANAPOLIS);

export default function BarberApprenticeshipIndianapolisPage() {
  return <IndianapolisProgramHubPage config={BARBER_APPRENTICESHIP_INDIANAPOLIS} />;
}
