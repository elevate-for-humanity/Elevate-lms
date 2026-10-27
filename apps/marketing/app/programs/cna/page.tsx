import HealthcareProgramPage, {
  generateMetadata as healthcareMetadata,
} from '../healthcare-training/[slug]/page';
export default function ProgramPage() {
  return HealthcareProgramPage({ params: Promise.resolve({ slug: 'cna' }) });
}
export function generateMetadata() {
  return healthcareMetadata({ params: Promise.resolve({ slug: 'cna' }) });
}
