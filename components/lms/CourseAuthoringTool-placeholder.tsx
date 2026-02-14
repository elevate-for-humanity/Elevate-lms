"use client";

/**
 * Course Authoring Tool - Temporarily Disabled
 *
 * This component is being rebuilt to use @dnd-kit instead of deprecated react-beautiful-dnd
 * For now, showing a Content message
 */
export default function CourseAuthoringTool() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-brand-blue-600" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-black mb-2">
          Course Authoring Tool
        </h1>

        <p className="text-black mb-6">
          This feature is being upgraded to use modern drag-and-drop technology.
        </p>

        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-brand-blue-900 mb-2">Alternative Options:</h3>
          <ul className="text-sm text-brand-blue-800 space-y-2 text-left">
            <li>• Use the Supabase dashboard to manage courses directly</li>
            <li>• Import courses via SQL migrations</li>
            <li>• Use the API endpoints to create courses programmatically</li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <a
            href="/admin"
            className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
          >
            Back to Admin
          </a>
          <a
            href="/admin/migrations"
            className="px-6 py-3 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition"
          >
            Run Migrations
          </a>
        </div>
      </div>
    </div>
  );
}
