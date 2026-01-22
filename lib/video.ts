// Video generation utilities
import { OnboardingScript } from "@/lib/onboardingSchema";
import { generateSpeech } from "@/lib/tts";
import fs from "fs";
import path from "path";

export type VideoAsset = {
  sceneId: string;
  audioUrl?: string;
  audioBuffer?: Buffer;
  visualType: string;
  visualData: any;
  audioPath?: string;
};

// Generate audio for a scene
export async function generateSceneAudio(text: string, sceneId: string): Promise<{ buffer: Buffer; path: string } | null> {
  try {
    console.log(`[Audio] Generating audio for scene "${sceneId}" from text: "${text.substring(0, 60)}..."`);
    const audioBuffer = await generateSpeech(text);
    
    if (!audioBuffer) {
      console.warn(`[Audio] TTS returned null, creating fallback silent audio`);
      // Create silent audio file if TTS fails
      const silentBuffer = await createSilentAudio(estimateAudioDuration(text));
      if (silentBuffer) {
        const tempDir = path.join(process.cwd(), "tmp", "audio");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        const audioPath = path.join(tempDir, `${sceneId}_silent.mp3`);
        fs.writeFileSync(audioPath, silentBuffer);
        console.log(`[Audio] Created silent audio fallback: ${audioPath} (${silentBuffer.length} bytes)`);
        return { buffer: silentBuffer, path: audioPath };
      }
      return null;
    }
    
    console.log(`[Audio] TTS succeeded, buffer size: ${audioBuffer.length} bytes`);
    
    // Save to temp directory
    const tempDir = path.join(process.cwd(), "tmp", "audio");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const audioPath = path.join(tempDir, `${sceneId}.mp3`);
    fs.writeFileSync(audioPath, audioBuffer);
    
    // Verify file was written
    if (!fs.existsSync(audioPath)) {
      console.error(`[Audio] Failed to write audio file: ${audioPath}`);
      return null;
    }
    
    const fileSize = fs.statSync(audioPath).size;
    console.log(`[Audio] ✓ Audio saved: ${audioPath} (${fileSize} bytes)`);
    
    return { buffer: audioBuffer, path: audioPath };
  } catch (error) {
    console.error(`Failed to generate audio for scene ${sceneId}:`, error);
    return null;
  }
}

// Create silent audio in MP3 format (using raw WAV-like data converted to MP3 minimal structure)
async function createSilentAudio(durationSeconds: number): Promise<Buffer | null> {
  try {
    // Create a simple WAV silent audio and convert concept
    // Since we don't have ffmpeg at hand here, create a minimal MP3 silence frame
    // MP3 frame header: 0xFFFB (sync) + parameters
    // This is a simplified approach - create repeated MP3 silence frames
    
    const frameDuration = 0.026; // 26ms per MP3 frame
    const frameCount = Math.ceil((durationSeconds / frameDuration));
    
    // MP3 silence frame (minimal, repeated)
    const mp3Frame = Buffer.from([
      0xFF, 0xFB, 0x90, 0x00, // Header
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // Silence data
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    
    const silentAudio = Buffer.concat(Array(Math.min(frameCount, 5000)).fill(mp3Frame));
    return silentAudio;
  } catch (error) {
    console.error("Failed to create silent audio:", error);
    return null;
  }
}

// Calculate audio duration (rough estimate: 150 words per minute = 2.5 words per second)
export function estimateAudioDuration(text: string): number {
  const wordCount = text.split(/\s+/).length;
  return Math.max(5, Math.ceil((wordCount / 2.5))); // at least 5 seconds
}

// Generate visual frame using canvas
export async function generateVisualFrame(
  scene: any,
  width: number = 1280,
  height: number = 720,
): Promise<Buffer | null> {
  try {
    // Dynamic import of canvas to avoid issues in non-Node environments
    const { createCanvas } = await import("canvas");
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#09090b");
    gradient.addColorStop(1, "#18181b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 48px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto";
    ctx.textAlign = "center";
    ctx.fillText(scene.title, width / 2, 100);

    // Narration (wrapped text)
    // Key highlights (avoid repeating narration)
ctx.fillStyle = "#e4e4e7";
ctx.font = "30px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto";
ctx.textAlign = "left";

const highlights = scene.visual?.highlights || [];
let y = 260;

for (const h of highlights.slice(0, 4)) {
  ctx.fillText("• " + h, 120, y);
  y += 50;
}

    // Highlights
    if (scene.visual?.highlights && scene.visual.highlights.length > 0) {
      ctx.fillStyle = "#a1f5fe";
      ctx.font = "20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto";
      ctx.textAlign = "left";
      
      let bulletY = height - 150;
      for (const highlight of scene.visual.highlights.slice(0, 3)) {
        ctx.fillText("• " + highlight, 80, bulletY);
        bulletY += 40;
      }
    }

    return canvas.toBuffer("image/png");
  } catch (error) {
    console.error("Failed to generate visual frame:", error);
    return null;
  }
}

// Helper function to wrap text
function wrapText(text: string, maxWidth: number, charLimit: number = 80): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > charLimit) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

export async function generateVideoAssets(script: OnboardingScript): Promise<VideoAsset[]> {
  const assets: VideoAsset[] = [];

  for (const scene of script.scenes) {
    const duration = estimateAudioDuration(scene.narration);
    
    assets.push({
      sceneId: scene.id,
      visualType: scene.visual?.type || "bullet_list",
      visualData: {
        title: scene.title,
        narration: scene.narration,
        description: scene.visual?.description,
        highlights: scene.visual?.highlights || [],
        duration,
      },
    });
  }

  return assets;
}

