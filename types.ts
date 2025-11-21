export interface Review {
  author: string;
  content: string;
  rating: number;
  productName: string;
}

export interface ReviewFormData {
  productUrl: string;
  reviewCount: number;
  tone: ReviewTone;
  length: ReviewLength;
}

export enum ReviewTone {
  ENTHUSIASTIC = 'Nadšený & Emotivní',
  PROBLEM_SOLUTION = 'Problém -> Řešení (Edukativní)',
  SKEPTICAL_CONVERTED = 'Skeptik -> Věrný zákazník'
}

export enum ReviewLength {
  SHORT = 'Krátká (1 úderná věta)',
  MEDIUM = 'Střední (2-4 věty)',
  LONG = 'Dlouhá (Detailní příběh)'
}

export interface GenerationStatus {
  isLoading: boolean;
  stage: 'idle' | 'analyzing' | 'generating' | 'finished';
  error: string | null;
  success: boolean;
}

export interface ProductAnalysis {
  name: string;
  description: string;
  targetAudience: string;
  marketingHooks: string[];
}
