import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Missing GEMINI_API_KEY in .env.local" },
        { status: 500 },
      );
    }

    const client = new GoogleGenAI({ apiKey });

    const response = await client.models.generateContent({
      // Use the same model name you confirmed working in Python / AI Studio.
      // Prefer using the exact model id from /api/gemini/models (supports both formats).
      model: "models/gemini-3-flash-preview",
      contents: "Reply with exactly: OnboardAI Gemini OK",
    });

    const text = response.text?.trim() ?? "";
    return NextResponse.json({ ok: true, text });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error.message || "Unknown error",
        details: error.toString()
      },
      { status: 500 },
    );
  }
}


