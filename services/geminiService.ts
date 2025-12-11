import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from the environment.
// Note: API_KEY is managed by the runtime environment.
// Fallback to prevent crash if key is missing during build/init
const apiKey = process.env.API_KEY || 'MISSING_API_KEY_PLACEHOLDER';

let aiInstance;
try {
    aiInstance = new GoogleGenAI({ apiKey });
} catch (e) {
    console.warn("GoogleGenAI failed to initialize in service. Using placeholder.", e);
    aiInstance = new GoogleGenAI({ apiKey: 'MISSING_API_KEY_PLACEHOLDER' });
}

export const ai = aiInstance;

/**
 * Placeholder for future AI service logic.
 */
export const geminiService = {
  // Add service methods here
};