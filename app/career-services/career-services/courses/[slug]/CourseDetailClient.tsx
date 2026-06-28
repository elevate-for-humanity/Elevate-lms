import { redirect } from 'next/navigation';

interface CourseDetailClientProps {
  course: any;
  modules: any[];
  reviews: any[];
  enrollment: any | null;
  isEnrolled: boolean;
  userProgress: any | null;
}

export function CourseDetailClient(props: CourseDetailClientProps) {
  // Redirect to main career-services course page  
  redirect('/career-services/courses');
}
