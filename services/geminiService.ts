import { GoogleGenAI, Type } from "@google/genai";
import { Expense } from "../types";

// Ensure API Key is present
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

/**
 * Generates an embedding for the expense description to enable semantic search.
 * We use 'text-embedding-004' as it is the current standard.
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    });
    return response.embeddings?.[0]?.values || [];
  } catch (error) {
    console.error("Error generating embedding:", error);
    return [];
  }
};

/**
 * Analyzes the receipt image to extract structured data.
 */
export const extractReceiptData = async (base64Image: string): Promise<Partial<Expense>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Multimodal capable, fast
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG for simplicity, can be dynamic
              data: base64Image,
            },
          },
          {
            text: `Analyze this receipt image. Extract the merchant name, total amount, currency, date (YYYY-MM-DD format), tax amount, and a list of purchased items. Also, categorize this expense into one of: 'Food & Dining', 'Transportation', 'Shopping', 'Utilities', 'Entertainment', 'Health', 'Travel', 'Business'.
            
            Return ONLY a valid JSON object.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            date: { type: Type.STRING },
            tax: { type: Type.NUMBER },
            category: { type: Type.STRING },
            items: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
          },
          required: ["merchant", "amount", "date", "category"],
        },
      },
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error extracting receipt data:", error);
    throw new Error("Failed to analyze receipt.");
  }
};

/**
 * Provides proactive financial advice based on the new expense and similar historical expenses.
 */
export const getProactiveAdvice = async (
  currentExpense: Partial<Expense>,
  similarExpenses: Expense[]
): Promise<{ advice: string[]; sentiment: 'positive' | 'neutral' | 'negative' | 'warning' }> => {
  try {
    const context = {
      current: currentExpense,
      history: similarExpenses.map(e => ({
        merchant: e.merchant,
        amount: e.amount,
        date: e.date,
        category: e.category
      }))
    };

    const prompt = `
      Act as a proactive, intelligent financial analyst.
      
      New Expense Context:
      ${JSON.stringify(context.current)}

      Similar Historical Expenses (found via semantic search):
      ${JSON.stringify(context.history)}

      Task:
      1. Compare the new expense to the history (price trends, frequency).
      2. Identify if this is higher than usual, a recurring subscription, or a good deal.
      3. Provide 3 short, actionable bullet points of advice or insight.
      4. Determine a sentiment/status (positive, neutral, negative, warning).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            sentiment: {
              type: Type.STRING,
              enum: ["positive", "neutral", "negative", "warning"]
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      advice: result.advice || ["Track your spending carefully."],
      sentiment: result.sentiment || "neutral"
    };

  } catch (error) {
    console.error("Error getting advice:", error);
    return { advice: ["Could not generate insights at this time."], sentiment: "neutral" };
  }
};
