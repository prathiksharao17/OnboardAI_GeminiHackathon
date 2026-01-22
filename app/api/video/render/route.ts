import { NextResponse } from "next/server";
import { OnboardingScript, onboardingScriptSchema } from "@/lib/onboardingSchema";
import {
  generateVideoAssets,
  generateSceneAudio,
  generateVisualFrame,
  estimateAudioDuration,
} from "@/lib/video";
import {
  createVideoSegment,
  concatenateVideos,
  createIntroCard,
  createOutroCard,
  optimizeVideo,
  cleanupTempFiles,
  VideoScene,
} from "@/lib/videoAssembly";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes timeout for full video generation

export async function POST(req: Request) {
  let tempDir: string | null = null;
  
  try {
    const body = (await req.json()) as { script: OnboardingScript };

    if (!body.script) {
      return NextResponse.json({ ok: false, error: "script is required" }, { status: 400 });
    }

    // Validate script
    const parsed = onboardingScriptSchema.safeParse(body.script);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid script format" },
        { status: 400 },
      );
    }

    const script = parsed.data;

    // Create temporary directory for all generated files
    tempDir = path.join(process.cwd(), "tmp", `video_${Date.now()}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Step 1: Generate video assets (audio + visuals for each scene)
    console.log(`[Video] Starting generation for ${script.projectName}`);
    console.log(`[Video] Total scenes: ${script.scenes.length}`);

    const segments: string[] = [];
    const audioDir = path.join(tempDir, "audio");
    const frameDir = path.join(tempDir, "frames");
    const segmentDir = path.join(tempDir, "segments");

    fs.mkdirSync(audioDir, { recursive: true });
    fs.mkdirSync(frameDir, { recursive: true });
    fs.mkdirSync(segmentDir, { recursive: true });

    // Create intro card
    const introPath = path.join(segmentDir, "00_intro.mp4");
    const introSuccess = await createIntroCard(
      script.projectName,
      script.oneLiner,
      introPath,
      4,
    );
    if (introSuccess) {
      segments.push(introPath);
      console.log("[Video] ✓ Created intro card");
    }

    // Process each scene
    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i];
      console.log(`[Video] Processing scene ${i + 1}/${script.scenes.length}: ${scene.title}`);

      // Generate audio
      const audioResult = await generateSceneAudio(scene.narration, `scene_${i}`);
      if (!audioResult) {
        console.warn(`[Video] Warning: Could not generate audio for scene ${i}`);
        continue;
      }

      // Generate visual frame
      const frameBuffer = await generateVisualFrame(scene);
      if (!frameBuffer) {
        console.warn(`[Video] Warning: Could not generate frame for scene ${i}`);
        continue;
      }

      // Save frame
      const framePath = path.join(frameDir, `scene_${i}.png`);
      fs.writeFileSync(framePath, frameBuffer);

      // Create video segment from frame + audio
      const segmentPath = path.join(segmentDir, `${String(i + 1).padStart(2, "0")}_scene.mp4`);
      const duration = estimateAudioDuration(scene.narration);

      const sceneData: VideoScene = {
        sceneId: scene.id,
        framePath,
        audioPath: audioResult.path,
        duration,
        title: scene.title,
      };

      const segmentSuccess = await createVideoSegment(sceneData, segmentPath);
      if (segmentSuccess) {
        segments.push(segmentPath);
        console.log(`[Video] ✓ Created video segment for scene ${i + 1}`);
      }
    }

    // Create outro card
    const outroPath = path.join(segmentDir, `${String(script.scenes.length + 2).padStart(2, "0")}_outro.mp4`);
    const outroSuccess = await createOutroCard(
      "Thank you for watching! 🚀",
      outroPath,
      3,
    );
    if (outroSuccess) {
      segments.push(outroPath);
      console.log("[Video] ✓ Created outro card");
    }

    if (segments.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Failed to generate any video segments" },
        { status: 500 },
      );
    }

    // Step 2: Concatenate all segments
    console.log(`[Video] Concatenating ${segments.length} segments...`);
    const rawVideoPath = path.join(tempDir, "raw_video.mp4");
    const concatSuccess = await concatenateVideos(segments, rawVideoPath);

    if (!concatSuccess) {
      return NextResponse.json(
        { ok: false, error: "Failed to concatenate video segments" },
        { status: 500 },
      );
    }

    console.log("[Video] ✓ Video segments concatenated");

    // Step 3: Optimize video for web
    console.log("[Video] Optimizing video for web...");
    const finalVideoPath = path.join(tempDir, "final_video.mp4");
    const optimizeSuccess = await optimizeVideo(rawVideoPath, finalVideoPath);

    if (!optimizeSuccess) {
      // Use raw video if optimization fails
      if (fs.existsSync(rawVideoPath)) {
        fs.copyFileSync(rawVideoPath, finalVideoPath);
      } else {
        return NextResponse.json(
          { ok: false, error: "Failed to optimize video" },
          { status: 500 },
        );
      }
    }

    console.log("[Video] ✓ Video optimization complete");

    // Step 4: Read video file for response
    if (!fs.existsSync(finalVideoPath)) {
      return NextResponse.json(
        { ok: false, error: "Video file not created" },
        { status: 500 },
      );
    }

    const videoBuffer = fs.readFileSync(finalVideoPath);
    const videoBase64 = videoBuffer.toString("base64");

    // Calculate final video stats
    const stats = fs.statSync(finalVideoPath);
    const videoSizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log(`[Video] ✓ Video generation complete! Size: ${videoSizeMB}MB`);

    // Clean up temporary files (optional - keep for debugging)
    // cleanupTempFiles(tempDir);

    return NextResponse.json({
      ok: true,
      message: "Video successfully generated!",
      video: {
        base64: videoBase64,
        mimeType: "video/mp4",
        size: stats.size,
        sizeMB: parseFloat(videoSizeMB),
      },
      metadata: {
        projectName: script.projectName,
        sceneCount: script.scenes.length,
        totalScenes: script.scenes.length + 2, // +intro and outro
        estimatedDurationSeconds: script.scenes.reduce(
          (sum, s) => sum + estimateAudioDuration(s.narration),
          7, // intro + outro
        ),
      },
    });
  } catch (error: any) {
    console.error("[Video] Error during video generation:", error);
    
    // Cleanup on error
    if (tempDir && fs.existsSync(tempDir)) {
      cleanupTempFiles(tempDir);
    }
    
    return NextResponse.json(
      { ok: false, error: error?.message ?? String(error) },
      { status: 500 },
    );
  }
}
