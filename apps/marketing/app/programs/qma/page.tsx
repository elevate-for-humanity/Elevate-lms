import HealthcareProgramPage, {
  generateMetadata as healthcareMetadata,
} from '../healthcare-training/[slug]/page';
export default function ProgramPage() {
  return HealthcareProgramPage({ params: Promise.resolve({ slug: 'qma' }) });
}
export function generateMetadata() {
  return healthcareMetadata({ params: Promise.resolve({ slug: 'qma' }) });
}
