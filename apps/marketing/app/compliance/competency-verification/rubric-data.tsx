// Rubric data exports
export const ALL_RUBRICS: RubricItem[] = [];

export interface RubricItem {
  id: string;
  name: string;
  category: string;
  criteria: RubricCriterion[];
}

export interface RubricCriterion {
  id: string;
  description: string;
  levels: {
    proficient: string;
    developing: string;
    beginning: string;
  };
}
