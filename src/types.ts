export enum CEFRLevel {
  A1 = "A1",
  A2 = "A2",
  B1 = "B1",
  B2 = "B2",
  C1 = "C1",
}

export interface UserProfile {
  username: string;
  currentLevel: CEFRLevel;
  targetBand: number; // e.g., 6.5, 7.0, 8.0
  joinedAt: string;
  geminiApiKey?: string;
  aiModel?: string;
}

export interface IELTSQuestion {
  id: string;
  part: 1 | 2 | 3;
  questionText: string;
  description?: string; // Guidance for Part 2 cue cards or Part 3 context
  tips?: string[];
}

export interface IELTSTopic {
  id: string;
  title: string;
  category: string;
  questions: IELTSQuestion[];
}

export interface CriteriaScore {
  score: number;
  comment: string;
}

export interface IELTSFeedback {
  overallBandScore: number;
  fluencyAndCoherence: CriteriaScore;
  lexicalResource: CriteriaScore;
  grammaticalRangeAccuracy: CriteriaScore;
  pronunciation: CriteriaScore;
  errorsIdentified: Array<{
    error: string;
    correction: string;
    explanation: string;
  }>;
  suggestedImprovements: Array<{
    original: string;
    betterWay: string;
  }>;
  keyCollocations: Array<{
    phrase: string;
    explanation: string;
    example: string;
  }>;
  sampleAnswer: string;
  todayLearningPoint: string;
  selfReflectionQuestions: string[];
}

export interface PracticeSession {
  id: string;
  username: string;
  topicTitle: string;
  questionText: string;
  part: 1 | 2 | 3;
  transcript: string;
  feedback: IELTSFeedback;
  levelUsed: CEFRLevel;
  createdAt: string;
}

export interface SavedCollocation {
  id: string;
  phrase: string;
  explanation: string;
  example: string;
  topicTitle: string;
  savedAt: string;
  mastered?: boolean;
  reviewCount?: number;
}

export interface ReflectionWorksheet {
  id: string;
  sessionId: string;
  topicTitle: string;
  questionText: string;
  todayLearningPoint: string;
  answers: { [questionIndex: number]: string };
  createdAt: string;
  generalNotes?: string;
  selfConfidence?: number; // 1-5 stars
}
