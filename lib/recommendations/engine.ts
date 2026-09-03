// Content recommendation engine
export interface UserProfile {
  id: string;
  interests: string[];
  completedCourses: string[];
  skillLevel: number;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic';
  goals: string[];
}

export interface Course {
  id: string;
  title: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  prerequisites: string[];
  rating: number;
  popularity: number;
}

export interface Recommendation {
  course: Course;
  score: number;
  reason: string;
}

export class RecommendationEngine {
  private static instance: RecommendationEngine;

  private constructor() {}

  static getInstance(): RecommendationEngine {
    if (!RecommendationEngine.instance) {
      RecommendationEngine.instance = new RecommendationEngine();
    }
    return RecommendationEngine.instance;
  }

  // Generate personalized recommendations
  getRecommendations(
    user: UserProfile,
    availableCourses: Course[],
    limit: number = 5,
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const course of availableCourses) {
      // Skip already completed courses
      if (user.completedCourses.includes(course.id)) {
        continue;
      }

      let score = 0;
      const reasons: string[] = [];

      // Interest matching (40% weight)
      const interestMatch = this.calculateInterestMatch(user.interests, course.topics);
      score += interestMatch * 0.4;
      if (interestMatch > 0.7) {
        reasons.push('Matches your interests');
      }

      // Skill level matching (30% weight)
      const skillMatch = this.calculateSkillMatch(user.skillLevel, course.level);
      score += skillMatch * 0.3;
      if (skillMatch > 0.8) {
        reasons.push('Perfect for your skill level');
      }

      // Prerequisites met (20% weight)
      const prereqMet = this.checkPrerequisites(user.completedCourses, course.prerequisites);
      score += prereqMet * 0.2;
      if (prereqMet === 1 && course.prerequisites.length > 0) {
        reasons.push('You meet all prerequisites');
      }

      // Popularity and rating (10% weight)
      const popularityScore = (course.rating / 5) * 0.5 + (course.popularity / 1000) * 0.5;
      score += popularityScore * 0.1;
      if (course.rating >= 4.5) {
        reasons.push('Highly rated by students');
      }

      recommendations.push({
        course,
        score,
        reason: reasons.join(' • ') || 'Recommended for you',
      });
    }

    // Sort by score and return top N
    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // Calculate interest match score
  private calculateInterestMatch(userInterests: string[], courseTopics: string[]): number {
    if (userInterests.length === 0 || courseTopics.length === 0) {
      return 0;
    }

    const matches = userInterests.filter((interest) =>
      courseTopics.some(
        (topic) =>
          topic.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(topic.toLowerCase()),
      ),
    );

    return matches.length / Math.max(userInterests.length, courseTopics.length);
  }

  // Calculate skill level match
  private calculateSkillMatch(userSkillLevel: number, courseLevel: string): number {
    const levelMap = {
      beginner: 30,
      intermediate: 60,
      advanced: 90,
    };

    const courseLevelValue = levelMap[courseLevel];
    const difference = Math.abs(userSkillLevel - courseLevelValue);

    // Perfect match if within 20 points
    if (difference <= 20) return 1;
    // Good match if within 40 points
    if (difference <= 40) return 0.7;
    // Acceptable match if within 60 points
    if (difference <= 60) return 0.4;
    // Poor match
    return 0.1;
  }

  // Check if prerequisites are met
  private checkPrerequisites(completedCourses: string[], prerequisites: string[]): number {
    if (prerequisites.length === 0) {
      return 1; // No prerequisites required
    }

    const metPrerequisites = prerequisites.filter((prereq) => completedCourses.includes(prereq));

    return metPrerequisites.length / prerequisites.length;
  }

  // Get similar courses (collaborative filtering)
  getSimilarCourses(courseId: string, allCourses: Course[], limit: number = 3): Course[] {
    const targetCourse = allCourses.find((c) => c.id === courseId);
    if (!targetCourse) return [];

    const similarities: Array<{ course: Course; score: number }> = [];

    for (const course of allCourses) {
      if (course.id === courseId) continue;

      let score = 0;

      // Category match (40%)
      if (course.category === targetCourse.category) {
        score += 0.4;
      }

      // Level match (30%)
      if (course.level === targetCourse.level) {
        score += 0.3;
      }

      // Topic overlap (30%)
      const topicOverlap = this.calculateInterestMatch(targetCourse.topics, course.topics);
      score += topicOverlap * 0.3;

      similarities.push({ course, score });
    }

    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.course);
  }

  // Get trending courses
  getTrendingCourses(allCourses: Course[], limit: number = 5): Course[] {
    return allCourses
      .sort((a, b) => {
        // Combine popularity and rating
        const scoreA = a.popularity * 0.6 + a.rating * 0.4;
        const scoreB = b.popularity * 0.6 + b.rating * 0.4;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  // Get courses for career path
  getCareerPathCourses(careerGoal: string, allCourses: Course[]): Course[] {
    const careerPaths: Record<string, string[]> = {
      healthcare: ['CNA', 'Medical Assistant', 'Phlebotomy', 'EMT'],
      'skilled-trades': ['HVAC', 'Electrical', 'Plumbing', 'Welding'],
      technology: ['Web Development', 'Data Analysis', 'Cybersecurity', 'Cloud Computing'],
      business: ['Project Management', 'Digital Marketing', 'Accounting', 'HR Management'],
    };

    const relevantTopics = careerPaths[careerGoal.toLowerCase()] || [];

    return allCourses
      .filter((course) =>
        relevantTopics.some(
          (topic) =>
            course.title.toLowerCase().includes(topic.toLowerCase()) ||
            course.topics.some((t) => t.toLowerCase().includes(topic.toLowerCase())),
        ),
      )
      .sort((a, b) => {
        // Sort by level (beginner first) then rating
        const levelOrder = { beginner: 0, intermediate: 1, advanced: 2 };
        if (levelOrder[a.level] !== levelOrder[b.level]) {
          return levelOrder[a.level] - levelOrder[b.level];
        }
        return b.rating - a.rating;
      });
  }
}

export const recommendationEngine = RecommendationEngine.getInstance();
