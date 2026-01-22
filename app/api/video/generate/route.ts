import { NextResponse } from "next/server";
import { OnboardingScript, onboardingScriptSchema } from "@/lib/onboardingSchema";
import { generateVideoAssets } from "@/lib/video";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { script: OnboardingScript };
    
    if (!body.script) {
      return NextResponse.json({ ok: false, error: "script is required" }, { status: 400 });
    }
    
    // Validate script
    const parsed = onboardingScriptSchema.safeParse(body.script);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid script format", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    
    // Generate video assets
    const assets = await generateVideoAssets(parsed.data);
    
    // For now, return the assets structure
    // In a full implementation, you'd:
    // 1. Generate TTS audio for each scene
    // 2. Generate visual frames/images
    // 3. Use FFmpeg or Remotion to combine into MP4
    
    return NextResponse.json({
      ok: true,
      assets,
      message: "Video generation started. In full implementation, this would generate MP4.",
      estimatedDuration: parsed.data.scenes.reduce((sum, s) => sum + (s.durationSec || 20), 0),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? String(error) }, { status: 500 });
  }
}

