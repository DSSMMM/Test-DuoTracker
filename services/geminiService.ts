import { GoogleGenAI } from "@google/genai";
import { Transaction, GeminiInsight } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const getSpendingInsights = async (transactions: Transaction[]): Promise<GeminiInsight[]> => {
  const ai = getClient();
  if (!ai) return [{
    title: 'API Key Missing',
    content: 'Please configure your API_KEY to see AI insights.',
    type: 'alert'
  }];

  // Summarize data to send to avoid token limits with raw data
  // Take top 50 recent or significant transactions for context
  const recentTransactions = transactions.slice(-50).map(t => 
    `${t.date}: ${t.description} - $${t.amount} (${t.category})`
  ).join('\n');

  const prompt = `
    Analyze the following expense transactions for a couple. 
    Provide 3 concise, actionable insights or observations formatted as JSON.
    Focus on trends, unusual spending, or savings opportunities.
    
    Transactions Sample:
    ${recentTransactions}

    Expected JSON Format:
    [
      { "title": "Insight Title", "content": "One sentence description.", "type": "saving" | "trend" | "alert" | "positive" }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as GeminiInsight[];
  } catch (error) {
    console.error("Gemini Error:", error);
    return [{
      title: 'Analysis Failed',
      content: 'Could not generate insights at this time.',
      type: 'alert'
    }];
  }
};

export const suggestCategory = async (
    description: string, 
    vendor: string,
    examples: { text: string; category: string }[] = []
): Promise<string | null> => {
    const ai = getClient();
    if (!ai) return null;
    
    // Construct a few-shot prompt with user's history
    const contextStr = examples.length > 0 
        ? `Here are some examples of how the user has categorized transactions in the past (use these as a style guide):\n${examples.map(e => `- "${e.text}" was categorized as ${e.category}`).join('\n')}\n\n`
        : '';

    const inputStr = `Description: "${description}"\nVendor: "${vendor}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
                You are an intelligent expense categorization assistant.
                
                ${contextStr}
                Based on the user's history (if provided) and general knowledge, categorize the following expense.
                ${inputStr}

                Return ONLY one of these exact values: Housing, Food & Dining, Groceries, Transportation, Utilities, Entertainment, Health & Fitness, Shopping, Travel, Other. 
                If unsure, return Other.
            `,
        });
        return response.text?.trim() || null;
    } catch (e) {
        console.error("AI Categorization failed", e);
        return null;
    }
}