#!/usr/bin/env bash
set -euo pipefail

PAGES_DIR="pages/scripts"
mkdir -p "$PAGES_DIR"

echo "⚛️  Generating React Page Templates from Seeds..."
echo ""

###########################################
# Student Onboarding Page
###########################################

cat << 'EOF' > "$PAGES_DIR/StudentOnboarding.tsx"
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import seeds from '@/seeds/elevate/elevate.json';

export default function StudentOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const { steps, supportLine } = seeds.student_onboarding;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Student Onboarding</h1>
        <p className="text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{step.name}</CardTitle>
          <CardDescription>Step {step.step}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-6">{step.script}</p>
          
          <div className="flex gap-4">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="outline"
            >
              Previous
            </Button>
            
            {step.cta && (
              <Button asChild>
                <a href={step.ctaUrl} target="_blank" rel="noopener noreferrer">
                  {step.cta}
                </a>
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={currentStep === steps.length - 1}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
        {steps.map((s, index) => (
          <button
            key={s.step}
            onClick={() => setCurrentStep(index)}
            className={`h-2 rounded-full transition-colors ${
              index === currentStep
                ? 'bg-primary'
                : index < currentStep
                ? 'bg-primary/50'
                : 'bg-muted'
            }`}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-center">{supportLine}</p>
      </div>
    </div>
  );
}
EOF

echo "✅ StudentOnboarding.tsx created"

###########################################
# Social Media Dashboard
###########################################

cat << 'EOF' > "$PAGES_DIR/SocialMediaDashboard.tsx"
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import seeds from '@/seeds/elevate/elevate.json';
import { Copy, Check } from 'lucide-react';

export default function SocialMediaDashboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { platforms, viral_cta, hashtags } = seeds.social_media;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Social Media Content</h1>
        <p className="text-muted-foreground">
          Ready-to-use social media posts for all platforms
        </p>
      </div>

      <Tabs defaultValue="facebook" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
        </TabsList>

        <TabsContent value="facebook">
          <Card>
            <CardHeader>
              <CardTitle>Facebook Posts</CardTitle>
              <CardDescription>Long and short format posts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Long Post</h3>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                    {platforms.facebook.long_post}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(platforms.facebook.long_post, 'fb-long')}
                  >
                    {copiedId === 'fb-long' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Short Post</h3>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                    {platforms.facebook.short_post}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(platforms.facebook.short_post, 'fb-short')}
                  >
                    {copiedId === 'fb-short' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instagram">
          <Card>
            <CardHeader>
              <CardTitle>Instagram Caption</CardTitle>
              <CardDescription>Optimized for Instagram posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                  {platforms.instagram.caption}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(platforms.instagram.caption, 'ig')}
                >
                  {copiedId === 'ig' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="twitter">
          <Card>
            <CardHeader>
              <CardTitle>Twitter/X Post</CardTitle>
              <CardDescription>Character-optimized for Twitter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                  {platforms.twitter.post}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(platforms.twitter.post, 'tw')}
                >
                  {copiedId === 'tw' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Viral Campaign: 100 Shares</CardTitle>
          <CardDescription>High-engagement call-to-action</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
              {viral_cta.content}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(viral_cta.content, 'viral')}
            >
              {copiedId === 'viral' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hashtags</CardTitle>
          <CardDescription>Use these hashtags for maximum reach</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag) => (
              <span
                key={tag}
                className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-primary/20"
                onClick={() => copyToClipboard(tag, tag)}
              >
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
EOF

echo "✅ SocialMediaDashboard.tsx created"

###########################################
# Program Pitches Page
###########################################

cat << 'EOF' > "$PAGES_DIR/ProgramPitches.tsx"
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import seeds from '@/seeds/elevate/elevate.json';

export default function ProgramPitchesPage() {
  const { programs } = seeds.program_pitches;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Program Pitches</h1>
        <p className="text-muted-foreground">
          Ready-to-use program descriptions for marketing and sales
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(programs).map(([key, program]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle>{program.name}</CardTitle>
              <CardDescription>Program Pitch</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{program.pitch}</p>
              <Button asChild>
                <a href={program.url} target="_blank" rel="noopener noreferrer">
                  View Program
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
EOF

echo "✅ ProgramPitches.tsx created"

###########################################
# Quick Links Page
###########################################

cat << 'EOF' > "$PAGES_DIR/QuickLinks.tsx"
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import seeds from '@/seeds/elevate/elevate.json';
import { ExternalLink } from 'lucide-react';

export default function QuickLinksPage() {
  const links = seeds.quick_links;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Quick Links</h1>
        <p className="text-muted-foreground">
          All important links organized by audience
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>For Students</CardTitle>
            <CardDescription>Student portal and program pages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(links.students).map(([key, url]) => (
              <Button key={key} asChild variant="outline" className="w-full justify-between">
                <a href={url as string} target="_blank" rel="noopener noreferrer">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>For Partners</CardTitle>
            <CardDescription>Partner and delegate portals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(links.partners).map(([key, url]) => (
              <Button key={key} asChild variant="outline" className="w-full justify-between">
                <a href={url as string} target="_blank" rel="noopener noreferrer">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>For Admins</CardTitle>
            <CardDescription>Admin dashboard and tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(links.admins).map(([key, url]) => (
              <Button key={key} asChild variant="outline" className="w-full justify-between">
                <a href={url as string} target="_blank" rel="noopener noreferrer">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Public Pages</CardTitle>
            <CardDescription>Certificate verification and contact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(links.public).map(([key, url]) => (
              <Button key={key} asChild variant="outline" className="w-full justify-between">
                <a href={url as string} target="_blank" rel="noopener noreferrer">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
EOF

echo "✅ QuickLinks.tsx created"

###########################################
# Generate README
###########################################

cat << 'EOF' > "$PAGES_DIR/README.md"
# React Page Templates

These React/Next.js page templates are auto-generated from the Elevate content seeds.

## Pages

- **StudentOnboarding.tsx** - Interactive student onboarding flow
- **SocialMediaDashboard.tsx** - Social media content manager
- **ProgramPitches.tsx** - Program pitch cards
- **QuickLinks.tsx** - Organized link directory

## Usage

### Import into Next.js App

```bash
# Copy to your app directory
cp pages/scripts/*.tsx app/scripts/
```

### Use as Components

```tsx
import StudentOnboarding from '@/pages/scripts/StudentOnboarding';

export default function OnboardingPage() {
  return <StudentOnboarding />;
}
```

### Customize

All pages import from `@/seeds/elevate/elevate.json`, so updating the seeds automatically updates all pages.

## Features

- ✅ Fully typed with TypeScript
- ✅ Uses shadcn/ui components
- ✅ Responsive design
- ✅ Copy-to-clipboard functionality
- ✅ Interactive step navigation
- ✅ Auto-synced with content seeds

## Dependencies

These pages require:
- Next.js 14+
- React 18+
- shadcn/ui components
- Tailwind CSS
- lucide-react icons
EOF

echo "✅ README.md created in $PAGES_DIR"
echo ""
echo "🎉 React page generation complete!"
echo ""
echo "📁 Generated pages:"
echo "   - pages/scripts/StudentOnboarding.tsx"
echo "   - pages/scripts/SocialMediaDashboard.tsx"
echo "   - pages/scripts/ProgramPitches.tsx"
echo "   - pages/scripts/QuickLinks.tsx"
echo "   - pages/scripts/README.md"
echo ""
echo "💡 These pages are ready to use in your Next.js app!"
echo ""
