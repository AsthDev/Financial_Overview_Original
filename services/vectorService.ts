import { Expense, SimilarityResult } from '../types';

// Simple cosine similarity function
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const findSimilarExpenses = (
  queryEmbedding: number[], 
  history: Expense[], 
  topK: number = 3
): SimilarityResult[] => {
  if (!queryEmbedding || history.length === 0) return [];

  const results: SimilarityResult[] = history
    .filter(item => item.embedding && item.embedding.length > 0)
    .map(item => ({
      expense: item,
      score: cosineSimilarity(queryEmbedding, item.embedding!)
    }));

  // Sort by score descending (most similar first)
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, topK);
};

// Helper to create a text representation for embedding
export const createEmbeddingText = (merchant: string, category: string, items?: string[]): string => {
  return `Expense at ${merchant} for ${category}. Items: ${items?.join(', ') || 'General goods'}`;
};
