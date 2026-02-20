import { Metadata } from 'next';
import { redirect } from 'next/navigation';


export const metadata: Metadata = {
  title: 'Create Course | Elevate for Humanity',
  description: 'Elevate for Humanity - Career training and workforce development programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/create-course',
  },
};

export default function CreateCoursePage() {
  redirect('/instructor/courses');
}
