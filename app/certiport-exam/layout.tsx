import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Certiport Exam Registration',
  description: 'Register for Certiport certification exams through Elevate for Humanity. Industry-recognized credentials in IT, healthcare, and business.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/certiport-exam',
  },
};

export default function CertiportExamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
