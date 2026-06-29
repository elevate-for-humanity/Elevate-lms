import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { createPublicClient } from '@/lib/supabase/public';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Award, 
  DollarSign,
  Building2,
  Users,
  TrendingUp
} from 'lucide-react';

// Revalidate every 10 minutes
export const revalidate = 600;

export const metadata: Metadata = {
  title: `Career Training Programs | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Browse ${PLATFORM_DEFAULTS.orgName} career training programs in healthcare, skilled trades, technology, and more. Many programs are WIOA-funded for eligible participants.`,
  alternates: {
    canonical: `${PLATFORM_DEFAULTS.siteUrl}/programs`,
  },
};

interface Program {
  slug: string;
  title: string;
  name: string;
  category: string;
  blurb: string | null;
  excerpt: string | null;
  description: string | null;
  total_hours: number | null;
  total_cost: number | null;
  credential_name: string | null;
  funding_tags: string[] | null;
  image_url: string | null;
  cover_url: string | null;
  hero_image: string | null;
  wioa_approved: boolean | null;
  is_active: boolean;
  published: boolean;
}

const CATEGORY_ORDER = [
  'healthcare',
  'beauty',
  'skilled-trades',
  'technology',
  'business',
  'hospitality',
  'transportation',
];

const CATEGORY_LABELS: Record<string, string> = {
  healthcare: 'Healthcare & Medical',
  beauty: 'Beauty & Cosmetology',
  'skilled-trades': 'Skilled Trades',
  technology: 'Technology & IT',
  business: 'Business & Finance',
  hospitality: 'Hospitality & Service',
  transportation: 'Transportation & CDL',
};

async function getPrograms(): Promise<Program[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('programs')
      .select('slug, title, name, category, blurb, excerpt, description, total_hours, total_cost, credential_name, funding_tags, image_url, cover_url, hero_image, wioa_approved, is_active, published')
      .eq('is_active', true)
      .eq('published', true)
      .order('title');
    
    if (error) {
      console.error('Error fetching programs:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
}

export default async function ProgramsPage() {
  const programs = await getPrograms();
  
  // Group programs by category
  const grouped = programs.reduce((acc, program) => {
    const cat = program.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(program);
    return acc;
  }, {} as Record<string, Program[]>);

  // Sort categories by preferred order
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const aIdx = CATEGORY_ORDER.indexOf(a);
    const bIdx = CATEGORY_ORDER.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  const featuredProgram = programs.find(p => 
    p.slug === 'cdl-training' || 
    p.slug === 'barber-apprenticeship' ||
    p.slug === 'cna'
  ) || programs[0];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-700 text-white py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Career Training Programs
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Launch your career with industry-recognized certifications. 
              Healthcare, skilled trades, technology, and more — many programs funded through WIOA.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/apply">
                <Button size="lg" className="bg-white text-brand-blue-900 hover:bg-blue-50">
                  Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/funding">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Check Funding Eligibility
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-slate-100 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-blue-900">{programs.length}+</div>
              <div className="text-slate-600">Programs</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-blue-900">WIOA</div>
              <div className="text-slate-600">Approved Funding</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-blue-900">DOL</div>
              <div className="text-slate-600">Registered Apprenticeships</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-blue-900">ETPL</div>
              <div className="text-slate-600">Listed Provider</div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs by Category */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Browse All Programs</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Select a category below to explore programs. Click any program for details and enrollment.
          </p>

          {sortedCategories.map((category) => (
            <div key={category} className="mb-16">
              <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                <span className="w-12 h-1 bg-brand-orange-500 mr-4"></span>
                {CATEGORY_LABELS[category] || category}
              </h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grouped[category].map((program) => (
                  <Link href={`/programs/${program.slug}`} key={program.slug}>
                    <Card className="h-full hover:shadow-lg transition-shadow duration-200 hover:border-brand-blue-300">
                      {program.image_url || program.cover_url || program.hero_image ? (
                        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={program.image_url || program.cover_url || program.hero_image || ''}
                            alt={program.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-brand-blue-100 to-brand-blue-200 rounded-t-lg flex items-center justify-center">
                          <Award className="h-16 w-16 text-brand-blue-400" />
                        </div>
                      )}
                      
                      <CardHeader>
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-lg font-bold leading-tight">
                            {program.title || program.name}
                          </CardTitle>
                          {program.wioa_approved && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 shrink-0">
                              WIOA
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                          {program.blurb || program.excerpt || program.description || 'Start your career training today.'}
                        </p>
                        
                        <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                          {program.total_hours && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {program.total_hours}h
                            </span>
                          )}
                          {program.total_cost && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              ${program.total_cost.toLocaleString()}
                            </span>
                          )}
                          {program.credential_name && (
                            <span className="flex items-center gap-1">
                              <Award className="h-4 w-4" />
                              {program.credential_name}
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-4 flex items-center text-brand-blue-600 font-medium text-sm">
                          View Program <ArrowRight className="ml-1 h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {programs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">Loading programs...</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-blue-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Career?</h2>
          <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
            Apply today or check your funding eligibility. Many programs are free or low-cost for eligible participants.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply">
              <Button size="lg" className="bg-brand-orange-500 hover:bg-orange-600 text-white">
                Apply Now
              </Button>
            </Link>
            <Link href="/funding">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Check Funding Eligibility
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="container mx-auto px-4 text-center">
          <p>{PLATFORM_DEFAULTS.orgName}</p>
          <p className="text-sm mt-2">{PLATFORM_DEFAULTS.address}</p>
          <p className="text-sm mt-1">{PLATFORM_DEFAULTS.phone} | {PLATFORM_DEFAULTS.email}</p>
        </div>
      </footer>
    </div>
  );
}
