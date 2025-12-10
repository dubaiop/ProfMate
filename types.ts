export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  LESSON = 'LESSON',
  CHAT = 'CHAT',
  QUIZ = 'QUIZ',
  VIDEO = 'VIDEO',
  LIVE_TUTOR = 'LIVE_TUTOR'
}

export enum DifficultyLevel {
  ELI5 = 'ELI5',
  STANDARD = 'STANDARD',
  DEEP_DIVE = 'DEEP_DIVE'
}

export interface UploadedFile {
  name: string;
  type: string;
  data: string; // Base64
}

export interface LessonContent {
  title: string;
  summary: string;
  sections: {
    heading: string;
    content: string;
    keyPoints: string[];
  }[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index
  explanation: string;
}

export interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

export interface VideoState {
  isGenerating: boolean;
  videoUri: string | null;
  error: string | null;
  prompt: string;
}