import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing GEMINI_API_KEY in .env.local" },
      { status: 500 },
    );
  }

  try {
    const client = new GoogleGenAI({ apiKey });
    const pager = await client.models.list({ config: { pageSize: 100 } });

    const models: Array<{ name?: string; displayName?: string; supportedActions?: string[] }> = [];
    for await (const m of pager) {
      models.push({
        name: (m as any).name,
        displayName: (m as any).displayName,
        supportedActions: (m as any).supportedActions,
      });
    }

    return NextResponse.json({ ok: true, models });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? String(error) },
      { status: 500 },
    );
  }
}


