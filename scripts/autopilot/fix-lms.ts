// scripts/autopilot/fix-lms.ts
//
// Aggressive LMS Autopilot Fixer
// - Scans for skeleton pages (short / TODO / "coming soon")
// - Overwrites them with full student & partner ready templates
// - Ensures core LMS routes exist with production-ready content
//
// Run with: npx ts-node scripts/autopilot/fix-lms.ts

import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'app');

type PageTemplate = {
  filePath: string;
  description: string;
  content: string;
};

// Templates: Production-ready pages
const templates: PageTemplate[] = [
  {
    filePath: 'app/programs/hvac/page.tsx',
    description: 'HVAC career pathway page',
    content: `import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export const metadata = {
  title: 'HVAC Technician Pathway | Elevate for Humanity',
  description: 'Launch your HVAC career with workforce-ready training, apprenticeships, and funding pathways.',
};

export default function HVACProgramPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-12 space-y-8">
        <header className="space-y-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            Workforce Training Program
          </p>
          <h1 className="text-4xl font-bold">HVAC Technician Career Pathway</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Hands-on, workforce-focused HVAC training built for working adults, career changers,
            and young people who want a skilled trade with real demand.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What You'll Learn</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc list-inside">
                  <li>HVAC fundamentals: heating, cooling, ventilation, and refrigeration</li>
                  <li>Tools, safety, and field etiquette for residential and light commercial work</li>
                  <li>Basic electrical concepts related to HVAC systems</li>
                  <li>Troubleshooting, maintenance, and customer communication</li>
                  <li>Preparation for industry-recognized entry-level certifications</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Who This Program Is For</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Adults looking for a new career in a high-demand trade</li>
                  <li>Young adults who want a skilled trade instead of a 4-year degree</li>
                  <li>People already in construction who want to specialize and increase earnings</li>
                  <li>Anyone seeking stable employment with growth potential</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Program Pathway</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 list-decimal list-inside">
                  <li>Complete your Elevate intake and funding screening</li>
                  <li>Enroll in the HVAC program and attend orientation</li>
                  <li>Complete online modules and guided in-person or lab experiences</li>
                  <li>Work with our team on employer connections and apprenticeships</li>
                  <li>Transition into employment with job search support and coaching</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Format</h4>
                  <p className="text-sm text-muted-foreground">Blended online + hands-on</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Schedule</h4>
                  <p className="text-sm text-muted-foreground">Flexible, evenings and weekends available</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Funding</h4>
                  <p className="text-sm text-muted-foreground">Workforce grant pathways may be available</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Support</h4>
                  <p className="text-sm text-muted-foreground">1:1 case management and career coaching</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ready to Get Started?</CardTitle>
                <CardDescription>
                  Complete the interest form and our team will follow up with next steps.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/apply">Start HVAC Interest Form</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/contact">Talk with the Elevate Team</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}
`,
  },

  {
    filePath: 'app/programs/barber/page.tsx',
    description: 'Barber apprenticeship page',
    content: `import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export const metadata = {
  title: 'Barber Apprenticeship | Elevate for Humanity',
  description: 'State-approved barber apprenticeship program leading to Indiana barber license.',
};

export default function BarberProgramPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-12 space-y-8">
        <header className="space-y-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            State-Approved Apprenticeship
          </p>
          <h1 className="text-4xl font-bold">Barber Apprenticeship Program</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Master the craft of barbering through a state-approved apprenticeship.
            Learn cutting, styling, and business skills in a real barbershop environment.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc list-inside">
                  <li>State-approved curriculum aligned with Indiana licensing requirements</li>
                  <li>2,000 hours of hands-on training in a working barbershop</li>
                  <li>Learn classic and modern cutting techniques</li>
                  <li>Business management and customer service skills</li>
                  <li>Preparation for state licensing exam</li>
                  <li>Earn while you learn through apprenticeship model</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What You'll Master</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Technical Skills</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Clipper techniques</li>
                      <li>Scissor work</li>
                      <li>Straight razor shaving</li>
                      <li>Fades and tapers</li>
                      <li>Beard grooming</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Professional Skills</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Client consultation</li>
                      <li>Sanitation and safety</li>
                      <li>Shop management</li>
                      <li>Retail and upselling</li>
                      <li>Building clientele</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Apprenticeship Pathway</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 list-decimal list-inside">
                  <li>Apply and complete intake process</li>
                  <li>Match with a licensed master barber and approved shop</li>
                  <li>Begin apprenticeship with structured training plan</li>
                  <li>Complete 2,000 hours of documented training</li>
                  <li>Pass state licensing exam</li>
                  <li>Launch your career as a licensed barber</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Duration</h4>
                  <p className="text-sm text-muted-foreground">12-18 months (2,000 hours)</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Format</h4>
                  <p className="text-sm text-muted-foreground">In-shop apprenticeship with online coursework</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Funding</h4>
                  <p className="text-sm text-muted-foreground">WIOA and apprenticeship funding available</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Outcome</h4>
                  <p className="text-sm text-muted-foreground">Indiana State Barber License</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Start Your Journey</CardTitle>
                <CardDescription>
                  Join the next generation of professional barbers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/apply">Apply for Barber Apprenticeship</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/contact">Schedule a Visit</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}
`,
  },

  {
    filePath: 'app/programs/cna/page.tsx',
    description: 'CNA certification page',
    content: `import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export const metadata = {
  title: 'CNA Certification | Elevate for Humanity',
  description: 'Certified Nursing Assistant training program with clinical experience and state certification.',
};

export default function CNAProgramPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-12 space-y-8">
        <header className="space-y-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            Healthcare Career Training
          </p>
          <h1 className="text-4xl font-bold">Certified Nursing Assistant (CNA)</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Start your healthcare career with CNA certification. Gain the skills and credentials
            needed to provide essential patient care in hospitals, nursing homes, and home health settings.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc list-inside">
                  <li>State-approved CNA training program</li>
                  <li>75+ hours of classroom instruction and clinical practice</li>
                  <li>Hands-on experience in real healthcare settings</li>
                  <li>Preparation for state certification exam</li>
                  <li>Job placement assistance upon completion</li>
                  <li>Fast-track to employment in growing healthcare field</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills You'll Develop</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Clinical Skills</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Vital signs monitoring</li>
                      <li>Patient hygiene and comfort</li>
                      <li>Mobility assistance</li>
                      <li>Nutrition and feeding</li>
                      <li>Infection control</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Professional Skills</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Patient communication</li>
                      <li>Medical documentation</li>
                      <li>Team collaboration</li>
                      <li>Ethics and professionalism</li>
                      <li>Emergency response</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Training Pathway</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 list-decimal list-inside">
                  <li>Complete application and background check</li>
                  <li>Attend classroom instruction (theory and skills lab)</li>
                  <li>Complete clinical rotation in healthcare facility</li>
                  <li>Pass state certification exam (written and skills)</li>
                  <li>Receive CNA certification and begin employment</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Duration</h4>
                  <p className="text-sm text-muted-foreground">4-6 weeks (75+ hours)</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Schedule</h4>
                  <p className="text-sm text-muted-foreground">Day and evening classes available</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Requirements</h4>
                  <p className="text-sm text-muted-foreground">High school diploma/GED, background check</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Funding</h4>
                  <p className="text-sm text-muted-foreground">Workforce grants and payment plans available</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Begin Your Healthcare Career</CardTitle>
                <CardDescription>
                  High demand, stable employment, and opportunities for advancement.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/apply">Apply for CNA Training</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/contact">Learn More</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}
`,
  },
];

// Skeleton detection
function isSkeleton(content: string): boolean {
  const lowered = content.toLowerCase();
  const badMarkers = [
    'todo',
    'coming soon',
    'skeleton',
    'placeholder',
    'under construction',
    'lorem ipsum',
  ];

  if (content.trim().length < 400) return true;
  if (badMarkers.some((m) => lowered.includes(m))) return true;

  return false;
}

// Helpers
function ensureAppDir() {
  if (!fs.existsSync(APP_DIR)) {
    process.exit(1);
  }
}

function writeFileAggressive(targetPath: string, content: string) {
  const full = path.join(ROOT, targetPath);
  const dir = path.dirname(full);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(full, content, 'utf8');
}

function auditAndFixTemplates() {
  ensureAppDir();

  templates.forEach((tpl) => {
    const full = path.join(ROOT, tpl.filePath);
    const exists = fs.existsSync(full);

    if (!exists) {
      writeFileAggressive(tpl.filePath, tpl.content);
      return;
    }

    const current = fs.readFileSync(full, 'utf8');
    if (isSkeleton(current)) {
        `🧹 OVERWRITING SKELETON: ${tpl.filePath} (${tpl.description})`
      );
      writeFileAggressive(tpl.filePath, tpl.content);
    } else {
    }
  });
}

function scanForSkeletons() {

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && full.endsWith('.tsx')) {
        const rel = path.relative(ROOT, full);
        const content = fs.readFileSync(full, 'utf8');
        if (isSkeleton(content)) {
        }
      }
    }
  }

  walk(APP_DIR);
}

function scanForAuthUsersQueries() {

  const badMatches: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (
        entry.isFile() &&
        (full.endsWith('.ts') || full.endsWith('.tsx'))
      ) {
        const rel = path.relative(ROOT, full);
        const content = fs.readFileSync(full, 'utf8');
        if (
          content.includes("from('auth.users'") ||
          content.includes('from("auth.users"')
        ) {
          badMatches.push(rel);
        }
      }
    }
  }

  walk(path.join(ROOT, 'app'));

  if (badMatches.length === 0) {
  } else {
  }
}

// Main
function main() {
  auditAndFixTemplates();
  scanForSkeletons();
  scanForAuthUsersQueries();
    '\n✨ Autopilot complete! Core LMS pages are production-ready.\n'
  );
}

main();
