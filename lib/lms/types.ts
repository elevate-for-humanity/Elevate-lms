export interface ProgramModule {
  id: string;
  title: string;
  description?: string;
  lessonCount?: number;
  order?: number;
}

export interface Program {
  id: string;
  title: string;
  slug: string;
  description: string;
  image?: string;
  duration?: string;
  certification?: string;
  format?: string;
  level?: string;
  access?: string;
  overview?: string;
  outcomes?: string[];
  modules?: ProgramModule[];
  is_active?: boolean;
  funded?: boolean;
}

export interface CourseProgress {
  id: string;
  title: string;
  slug: string;
  progress: number;
  status: string;
  lastLesson?: string;
  courseId?: string;
}
