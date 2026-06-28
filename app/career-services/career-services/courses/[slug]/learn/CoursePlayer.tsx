import { redirect } from 'next/navigation';

interface CoursePlayerProps {
  course: any;
  modules: any[];
  currentLesson: any;
  progress: any;
  isEnrolled: boolean;
}

export function CoursePlayer(props: CoursePlayerProps) {
  // Redirect to main career-services courses
  redirect('/career-services/courses');
}
