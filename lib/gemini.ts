import { GoogleGenAI } from "@google/genai";
import { requireEnv } from "@/lib/env";

export function getGeminiClient() {
  const apiKey = requireEnv("GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey });
}

// Default to a model that typically has free-tier quota enabled.
export const DEFAULT_ONBOARDING_MODEL = "models/gemini-2.5-flash";


