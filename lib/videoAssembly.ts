// Video assembly using FFmpeg
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export type VideoScene = {
  sceneId: string;
  framePath: string;
  audioPath: string;
  duration: number;
  title: string;
};

/**
 * Create a video segment from a frame and audio
 */
export async function createVideoSegment(
  scene: VideoScene,
  outputPath: string,
): Promise<boolean> {
  try {
    // Verify files exist
    if (!fs.existsSync(scene.audioPath)) {
      console.error(`[FFmpeg] Audio file not found: ${scene.audioPath}`);
      return false;
    }
    
    const audioStats = fs.statSync(scene.audioPath);
    console.log(`[FFmpeg] Creating segment: frame + audio (${audioStats.size} bytes, ${scene.duration}s)`);
    
    // Simpler approach: let FFmpeg figure out duration from audio, match video to it
    // Use -shortest to sync to audio length automatically
    const command = `ffmpeg -loop 1 -i "${scene.framePath}" -i "${scene.audioPath}" -c:v libx264 -preset veryfast -c:a aac -shortest -pix_fmt yuv420p -y "${outputPath}"`;
    
    const { stdout, stderr } = await execAsync(command);
    
    // Verify output
    if (!fs.existsSync(outputPath)) {
      console.error(`[FFmpeg] Output file not created`);
      return false;
    }
    
    const outputStats = fs.statSync(outputPath);
    console.log(`[FFmpeg] ✓ Segment created: ${outputStats.size} bytes`);
    return true;
  } catch (error) {
    console.error(`Failed to create video segment:`, error);
    return false;
  }
}

/**
 * Create a concat file for FFmpeg
 */
export function createConcatFile(
  segments: string[],
  concatFilePath: string,
): void {
  const concatContent = segments
    .map((segment) => `file '${segment}'`)
    .join("\n");
  
  fs.writeFileSync(concatFilePath, concatContent);
}

/**
 * Concatenate video segments into a single video
 */
export async function concatenateVideos(
  segments: string[],
  outputPath: string,
): Promise<boolean> {
  try {
    const tempDir = path.dirname(outputPath);
    const concatFile = path.join(tempDir, "concat.txt");
    
    createConcatFile(segments, concatFile);
    
    // Use re-encoding for audio to work properly
    // -c:v libx264 -c:a aac ensures audio is preserved
    const command = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c:v libx264 -preset fast -c:a aac -b:a 192k -y "${outputPath}"`;
    
    console.log(`[FFmpeg] Concatenating ${segments.length} segments with audio re-encoding...`);
    const { stdout, stderr } = await execAsync(command);
    
    // Clean up concat file
    if (fs.existsSync(concatFile)) {
      fs.unlinkSync(concatFile);
    }
    
    if (!fs.existsSync(outputPath)) {
      console.error(`[FFmpeg] Concatenated file not created`);
      return false;
    }
    
    const outputStats = fs.statSync(outputPath);
    console.log(`[FFmpeg] ✓ Concatenation complete: ${outputStats.size} bytes`);
    
    // Check file size - should be significantly larger if audio is included
    if (outputStats.size < 500000) {
      console.warn(`[FFmpeg] ⚠️ Output file seems small (${outputStats.size} bytes), audio may be missing`);
    }
    
    return true;
  } catch (error) {
    console.error("Failed to concatenate videos:", error);
    return false;
  }
}

/**
 * Add text overlay to a video (title card)
 */
export async function addTextOverlay(
  inputPath: string,
  outputPath: string,
  text: string,
  duration: number = 3,
): Promise<boolean> {
  try {
    const escapeText = text.replace(/'/g, "'\\''");
    const command = `ffmpeg -f lavfi -i color=c=black:s=1280x720:d=${duration} -vf "drawtext=text='${escapeText}':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:font=Arial" -y "${outputPath}"`;
    
    await execAsync(command);
    return true;
  } catch (error) {
    console.error("Failed to add text overlay:", error);
    return false;
  }
}

/**
 * Optimize video for web (reduce size, ensure compatibility)
 */
export async function optimizeVideo(
  inputPath: string,
  outputPath: string,
): Promise<boolean> {
  try {
    const command = `ffmpeg -i "${inputPath}" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -pix_fmt yuv420p -y "${outputPath}"`;
    
    await execAsync(command);
    return true;
  } catch (error) {
    console.error("Failed to optimize video:", error);
    return false;
  }
}

/**
 * Get video duration in seconds
 */
export async function getVideoDuration(filePath: string): Promise<number> {
  try {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noinject=1 "${filePath}"`;
    const { stdout } = await execAsync(command);
    return parseFloat(stdout.trim());
  } catch (error) {
    console.error("Failed to get video duration:", error);
    return 0;
  }
}

/**
 * Create intro title card
 */
export async function createIntroCard(
  projectName: string,
  oneLiner: string,
  outputPath: string,
  duration: number = 5,
): Promise<boolean> {
  try {
    console.log("[FFmpeg] Creating intro card...");
    const { createCanvas } = await import("canvas");
    const canvas = createCanvas(1280, 720);
    const ctx = canvas.getContext("2d");

    // Draw black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 1280, 720);

    // Draw project name
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 96px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(projectName, 640, 280);

    // Draw tagline
    ctx.fillStyle = "#e4e4e7";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const tagline = oneLiner.substring(0, 100);
    const words = tagline.split(" ");
    let line = "";
    let lineNum = 0;
    const lineHeight = 50;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + (line ? " " : "") + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 1000 && line) {
        ctx.fillText(line, 640, 420 + lineNum * lineHeight);
        line = words[i];
        lineNum++;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, 640, 420 + lineNum * lineHeight);
    }

    // Save frame to PNG
    const frameDir = path.dirname(outputPath);
    if (!fs.existsSync(frameDir)) {
      fs.mkdirSync(frameDir, { recursive: true });
    }

    const framePath = path.join(frameDir, "intro_frame.png");
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(framePath, buffer);

    // Create silent audio track (so it has audio stream for concatenation)
    const silentAudioPath = path.join(frameDir, "intro_silent.aac");
    const silentAudioCommand = `ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t ${duration} -q:a 9 -acodec libmp3lame "${silentAudioPath}" -y`;
    try {
      await execAsync(silentAudioCommand);
    } catch (e) {
      console.warn("[FFmpeg] Failed to create silent audio, continuing...");
    }

    // Use FFmpeg to convert PNG frame + silent audio to video
    let command: string;
    if (fs.existsSync(silentAudioPath)) {
      // With silent audio
      command = `ffmpeg -loop 1 -i "${framePath}" -i "${silentAudioPath}" -c:v libx264 -c:a aac -t ${duration} -pix_fmt yuv420p -shortest -y "${outputPath}"`;
    } else {
      // Fallback: without audio
      command = `ffmpeg -loop 1 -i "${framePath}" -c:v libx264 -t ${duration} -pix_fmt yuv420p -y "${outputPath}"`;
    }
    await execAsync(command);

    // Clean up frame file
    if (fs.existsSync(framePath)) {
      fs.unlinkSync(framePath);
    }

    return true;
  } catch (error) {
    console.error("Failed to create intro card:", error);
    return false;
  }
}

/**
 * Create outro card
 */
export async function createOutroCard(
  message: string = "Thank you for watching!",
  outputPath: string,
  duration: number = 3,
): Promise<boolean> {
  try {
    console.log("[FFmpeg] Creating outro card...");
    const { createCanvas } = await import("canvas");
    const canvas = createCanvas(1280, 720);
    const ctx = canvas.getContext("2d");

    // Draw black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 1280, 720);

    // Draw message
    ctx.fillStyle = "#10b981";
    ctx.font = "64px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(message, 640, 360);

    // Save frame to PNG
    const frameDir = path.dirname(outputPath);
    if (!fs.existsSync(frameDir)) {
      fs.mkdirSync(frameDir, { recursive: true });
    }

    const framePath = path.join(frameDir, "outro_frame.png");
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(framePath, buffer);

    // Create silent audio track (so it has audio stream for concatenation)
    const silentAudioPath = path.join(frameDir, "outro_silent.aac");
    const silentAudioCommand = `ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t ${duration} -q:a 9 -acodec libmp3lame "${silentAudioPath}" -y`;
    try {
      await execAsync(silentAudioCommand);
    } catch (e) {
      console.warn("[FFmpeg] Failed to create silent audio for outro, continuing...");
    }

    // Use FFmpeg to convert PNG frame + silent audio to video
    let command: string;
    if (fs.existsSync(silentAudioPath)) {
      // With silent audio
      command = `ffmpeg -loop 1 -i "${framePath}" -i "${silentAudioPath}" -c:v libx264 -c:a aac -t ${duration} -pix_fmt yuv420p -shortest -y "${outputPath}"`;
    } else {
      // Fallback: without audio
      command = `ffmpeg -loop 1 -i "${framePath}" -c:v libx264 -t ${duration} -pix_fmt yuv420p -y "${outputPath}"`;
    }
    await execAsync(command);

    // Clean up frame file
    if (fs.existsSync(framePath)) {
      fs.unlinkSync(framePath);
    }

    return true;
  } catch (error) {
    console.error("Failed to create outro card:", error);
    return false;
  }
}

/**
 * Clean up temporary files
 */
export function cleanupTempFiles(tempDir: string): void {
  try {
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      }
      fs.rmdirSync(tempDir);
    }
  } catch (error) {
    console.warn("Failed to cleanup temp files:", error);
  }
}
