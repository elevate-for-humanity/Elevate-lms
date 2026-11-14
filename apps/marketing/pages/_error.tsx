import { NextPageContext } from 'next';
import Link from 'next/link';

interface ErrorPageProps {
  statusCode?: number;
  message?: string;
}

export default function ErrorPage({ statusCode = 404, message }: ErrorPageProps) {
  const isNotFound = statusCode === 404;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-brand-blue-600 mb-4">
          {statusCode}
        </h1>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          {isNotFound ? 'Page Not Found' : 'Something went wrong'}
        </h2>
        <p className="text-slate-600 mb-8">
          {isNotFound
            ? 'The page you are looking for does not exist or has been moved.'
            : message || 'An unexpected error occurred.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 font-medium"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  return { statusCode };
};
