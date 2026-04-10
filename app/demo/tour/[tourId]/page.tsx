import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getTour, getTourStep } from '@/lib/demo/tours';
import { DemoLicenseType } from '@/lib/demo/context';

interface PageProps {
  params: Promise<{ tourId: string }>;
  searchParams: Promise<{ step?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Demo pages are not indexed — gated behind requireDemo in layout
  const baseRobots = { index: false, follow: false } as const;
  const { tourId } = await params;
  const tour = getTour(tourId as DemoLicenseType);
  
  if (!tour) {
    return { title: 'Tour Not Found', robots: baseRobots };
  }
  
  return {
    robots: baseRobots,
    title: `${tour.name} | Demo | Elevate LMS`,
    description: tour.description,
  };
}

export default async function TourStartPage({ params, searchParams }: PageProps) {
  const { tourId } = await params;
  const { step } = await searchParams;
  
  // Validate tour exists
  const validTours: DemoLicenseType[] = ['institution_admin', 'partner_employer', 'workforce_program'];
  if (!validTours.includes(tourId as DemoLicenseType)) {
    notFound();
  }
  
  const tour = getTour(tourId as DemoLicenseType);
  if (!tour) {
    notFound();
  }
  
  // Get step number (default to 1)
  const stepNumber = parseInt(step || '1', 10);
  const tourStep = getTourStep(tourId as DemoLicenseType, stepNumber);
  
  if (!tourStep) {
    // Invalid step, redirect to step 1
    redirect(`/demo/tour/${tourId}?step=1`);
  }
  
  // Redirect to the actual page with tour overlay params
  redirect(`${tourStep.route}?demoTour=${tourId}&step=${stepNumber}`);
}
