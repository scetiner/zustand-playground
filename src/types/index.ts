export interface Lesson {
  id: string;
  number: number;
  title: string;
  description: string;
  category: LessonCategory;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export type LessonCategory = 
  | 'fundamentals'
  | 'middleware'
  | 'patterns'
  | 'typescript'
  | 'integration'
  | 'mfe'
  | 'testing'
  | 'summary';

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: number;
  explorationNotes?: string;
}

export interface UserProgress {
  currentLessonId: string;
  completedLessons: Record<string, LessonProgress>;
  startedAt: number;
  lastAccessedAt: number;
}

export interface InteractiveExample {
  id: string;
  title: string;
  description: string;
  initialState: Record<string, unknown>;
}

export interface StateChange {
  timestamp: number;
  action: string;
  prevState: Record<string, unknown>;
  nextState: Record<string, unknown>;
}

