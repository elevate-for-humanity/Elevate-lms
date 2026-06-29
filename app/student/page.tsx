import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  GraduationCap,
  BookOpen,
  Award,
  Users,
  Calendar,
  MessageSquare,
  Briefcase,
  FileText,
  ArrowRight,
  LogIn,
  CheckCircle,
  Clock
} from 'lucide-react';

export const metadata: Metadata = {
  title: `Student Portal | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Access your student dashboard at ${PLATFORM_DEFAULTS.orgName}. View courses, track progress, and manage your learning.`,
  alternates: {
    canonical: `${PLATFORM_DEFAULTS.siteUrl}/student`,
  },
};

export default async function StudentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const studentFeatures = [
    {
      icon: BookOpen,
      title: 'My Courses',
      description: 'Access your enrolled courses and lessons',
      href: '/lms/courses',
    },
    {
      icon: Calendar,
      title: 'Schedule',
      description: 'View upcoming classes and deadlines',
      href: '/lms/calendar',
    },
    {
      icon: Award,
      title: 'Certificates',
      description: 'View and download your earned certificates',
      href: '/lms/certificates',
    },
    {
      icon: FileText,
      title: 'Assignments',
      description: 'Submit and track your assignments',
      href: '/lms/assignments',
    },
    {
      icon: MessageSquare,
      title: 'Messages',
      description: 'Communicate with instructors and peers',
      href: '/lms/messages',
    },
    {
      icon: Briefcase,
      title: 'Career Services',
      description: 'Get help with job placement and resume',
      href: '/lms/placement',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-brand-blue-900 text-white py-6">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GraduationCap className="h-8 w-8 text-brand-orange-500" />
            <div>
              <h1 className="text-xl font-bold">Student Portal</h1>
              <p className="text-blue-200 text-sm">{PLATFORM_DEFAULTS.orgName}</p>
            </div>
          </div>
          <div>
            {user ? (
              <Link href="/lms/dashboard">
                <Button className="bg-brand-orange-500 hover:bg-orange-600">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="bg-brand-orange-500 hover:bg-orange-600">
                  <LogIn className="mr-2 h-4 w-4" />
                  Student Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {user ? (
          // Authenticated student view
          <div>
            <div className="flex items-center gap-4 mb-8">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold">Welcome back!</h2>
                <p className="text-slate-600">{user.email}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentFeatures.map((feature) => (
                <Link href={feature.href} key={feature.title}>
                  <Card className="h-full hover:shadow-lg transition-shadow hover:border-brand-blue-300">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                          <feature.icon className="h-5 w-5 text-brand-blue-900" />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/lms/dashboard">
                <Button size="lg">
                  Go to Full Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          // Not logged in
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <GraduationCap className="h-16 w-16 text-brand-blue-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Student Portal</h2>
              <p className="text-slate-600 text-lg">
                Access your courses, track your progress, connect with instructors, and manage your learning journey.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Student Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">
                  If you are a registered student, sign in with your credentials.
                </p>
                <Link href="/login" className="block">
                  <Button className="w-full bg-brand-blue-600 hover:bg-blue-700">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-500 text-center">
                    New student?{' '}
                    <Link href="/apply" className="text-brand-blue-600 hover:underline">
                      Apply for training
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8">
              <h3 className="font-bold mb-4">What's Available in the Student Portal</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {studentFeatures.map((feature) => (
                  <div key={feature.title} className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                    <feature.icon className="h-5 w-5 text-brand-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-sm text-slate-500">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Card className="mt-8 bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-green-900">Need to Start?</h4>
                    <p className="text-green-700 text-sm mt-1">
                      Don't have an account yet? Apply for training to start your career journey.
                    </p>
                    <Link href="/apply" className="inline-block mt-3">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Help Section */}
      <section className="py-12 bg-slate-200">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-xl font-bold mb-4">Need Help?</h3>
            <p className="text-slate-600 mb-6">
              Our student support team is here to help you succeed.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/support">
                <Button variant="outline">Help Center</Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline">Contact Support</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6">
        <div className="container mx-auto px-4 text-center">
          <p>{PLATFORM_DEFAULTS.orgName} Student Portal</p>
          <p className="text-sm mt-1">{PLATFORM_DEFAULTS.phone} | {PLATFORM_DEFAULTS.email}</p>
        </div>
      </footer>
    </div>
  );
}
