import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ChevronRight,
  Search,
  User,
  Shield,
  Eye,
  AlertCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Search Records | FERPA Portal',
  description: 'Search student education records in compliance with FERPA.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  type?: string;
}

interface StudentResult {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  enrollments?: { id: string; status: string }[];
}

export default async function FerpaRecordsSearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/ferpa/records/search');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['admin', 'super_admin', 'ferpa_officer', 'registrar', 'staff'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  const query = params.q || '';
  const searchType = params.type || 'all';
  let results: StudentResult[] = [];
  let searchPerformed = false;

  if (query.length >= 2) {
    searchPerformed = true;
    
    let dbQuery = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        created_at,
        enrollments (id, status)
      `)
      .eq('role', 'student');

    if (searchType === 'email') {
      dbQuery = dbQuery.ilike('email', `%${query}%`);
    } else if (searchType === 'name') {
      dbQuery = dbQuery.ilike('full_name', `%${query}%`);
    } else {
      // Search both name and email
      dbQuery = dbQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
    }

    const { data, error } = await dbQuery.limit(25);

    if (error) {
      logger.error('Search error:', error);
    } else {
      results = (data as StudentResult[]) || [];
    }

    // Log the search for audit purposes
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'ferpa_record_search',
      details: { query, searchType, results_count: results.length },
      ip_address: null,
    }).then(() => {}).catch(() => {});
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/ferpa-page-7.jpg" alt="FERPA compliance" fill sizes="100vw" className="object-cover" priority />
      </section>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/ferpa" className="hover:text-gray-700">FERPA Portal</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/ferpa/records" className="hover:text-gray-700">Records</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Search</span>
          </nav>

          <h1 className="text-2xl font-bold text-gray-900">Search Student Records</h1>
          <p className="text-gray-600 mt-1">
            Search for student education records by name or email
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form method="GET" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="q" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Query
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="q"
                    name="q"
                    defaultValue={query}
                    placeholder="Enter student name or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    minLength={2}
                    required
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Search By
                </label>
                <select
                  id="type"
                  name="type"
                  defaultValue={searchType}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                >
                  <option value="all">All Fields</option>
                  <option value="name">Name Only</option>
                  <option value="email">Email Only</option>
                </select>
              </div>
              <div className="sm:self-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* FERPA Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">FERPA Compliance Reminder</h3>
              <p className="text-sm text-amber-700 mt-1">
                All searches are logged for audit purposes. Only search for records you have 
                a legitimate educational need to access. Minimum 2 characters required.
              </p>
            </div>
          </div>
        </div>

        {/* Results */}
        {searchPerformed && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Search Results
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({results.length} {results.length === 1 ? 'record' : 'records'} found)
                </span>
              </h2>
            </div>

            {results.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {results.map((student) => (
                  <div key={student.id} className="px-6 py-4 hover:bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.full_name || 'No name on file'}
                          </p>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>ID: {student.id.slice(0, 8)}...</span>
                            <span>Created: {formatDate(student.created_at)}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-brand-blue-100 text-brand-blue-700">
                              {student.enrollments?.length || 0} enrollments
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/admin/learner/${student.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-brand-blue-600 hover:text-brand-blue-700 hover:bg-brand-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Full Record
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No records found matching &quot;{query}&quot;</p>
                <p className="text-sm text-slate-500 mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        )}

        {!searchPerformed && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Search Student Records</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Enter a student name or email address above to search education records.
              All searches are logged for FERPA compliance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
