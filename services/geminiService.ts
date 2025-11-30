import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from the environment.
// Note: API_KEY is managed by the runtime environment.
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Placeholder for future AI service logic.
 */
export const geminiService = {
  // Add service methods here
};
