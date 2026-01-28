export interface Expense {
  id: string;
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  tax?: number;
  items?: string[];
  description?: string;
  embedding?: number[]; // Vector representation for semantic search
  receiptImage?: string; // Base64
}

export interface AnalysisResult {
  extractedData: Partial<Expense>;
  advisory: string[];
  similarExpenses: Expense[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'warning';
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SCANNER = 'SCANNER',
  HISTORY = 'HISTORY',
}

export interface SimilarityResult {
  expense: Expense;
  score: number;
}
