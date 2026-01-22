import { NextResponse } from "next/server";
import { DEFAULT_ONBOARDING_MODEL, getGeminiClient } from "@/lib/gemini";
import { fetchRepoReadme, fetchRepoTree, fetchTextFile, parseGitHubRepoUrl, pickImportantPaths } from "@/lib/github";
import { onboardingScriptSchema } from "@/lib/onboardingSchema";

export const runtime = "nodejs";

function truncate(s: string, max = 8000) {
  if (s.length <= max) return s;
  return s.slice(0, max) + "\n\n...[truncated]...";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { repoUrl?: string; model?: string };
    const repoUrl = body.repoUrl?.trim();
    if (!repoUrl) {
      return NextResponse.json({ ok: false, error: "repoUrl is required" }, { status: 400 });
    }

    const ref = parseGitHubRepoUrl(repoUrl);
    const readme = await fetchRepoReadme(ref);
    const { branch, defaultBranch, tree } = await fetchRepoTree(ref);

    const allPaths = tree
      .filter((n) => n.type === "blob")
      .map((n) => n.path)
      .filter(Boolean) as string[];

    const picked = pickImportantPaths(allPaths);
    const files = (await Promise.all(picked.map((p) => fetchTextFile(ref, p)))).filter(Boolean);

    const repoContext = {
      repo: { owner: ref.owner, repo: ref.repo, branch, defaultBranch },
      folderTree: allPaths.slice(0, 200),
      readme: readme ? { path: readme.path, content: truncate(readme.content, 14000) } : null,
      files: files.map((f) => ({ path: f.path, content: truncate(f.content, 12000) })),
    };

    const model = body.model ?? DEFAULT_ONBOARDING_MODEL;
    const client = getGeminiClient();

    const schemaHint = {
      projectName: "string",
      oneLiner: "string",
      techStack: ["string"],
      architecture: {
        overview: "string",
        keyModules: [{ name: "string", responsibility: "string", files: ["path"] }],
        dataFlow: "string (optional)",
      },
      setup: { prerequisites: ["string"], steps: ["string"], runCommands: ["string"] },
      contributorStartPoints: [{ title: "string", description: "string", suggestedFiles: ["path"] }],
      scenes: [
        {
          id: "scene-1",
          title: "string",
          narration: "string",
          onScreenText: ["string"],
          visual: { type: "title|folder_tree|diagram|code_highlight|bullet_list", description: "string", highlights: ["string"] },
          durationSec: 15,
        },
      ],
    };

    const prompt = [
      "You are an expert senior engineer creating a comprehensive onboarding video for a new developer joining this codebase.",
      "Your goal is to create an engaging, diverse, and technically deep script that helps developers understand the project quickly.",
      "",
      "CRITICAL: Return ONLY valid JSON. No markdown code fences (```json), no explanations, no comments.",
      "The JSON must be parseable and match this exact structure:",
      JSON.stringify(schemaHint, null, 2),
      "",
      "Required fields:",
      "- projectName: string",
      "- oneLiner: string (compelling one-liner)",
      "- techStack: array of technologies used",
      "- architecture: overview of how the system works",
      "- setup: prerequisites, steps, and run commands",
      "- contributorStartPoints: where new contributors should start",
      "- scenes: 5-7 diverse scenes with clear narration and visuals",
      "",
      "Visual types must be one of: title, folder_tree, diagram, code_highlight, bullet_list",
      "",
      "DEEP ANALYSIS REQUIREMENTS:",
      "1. ARCHITECTURE & DESIGN: Explain the system architecture, key design patterns, and how components interact",
      "2. DATA FLOW: Describe how data flows through the application (requests, processing, responses)",
      "3. KEY MODULES: Identify and explain the main modules/services and their responsibilities",
      "4. CODE INSIGHTS: Point out important files, key functions, and critical business logic",
      "5. TECHNOLOGY CHOICES: Explain why specific technologies/libraries are used",
      "6. SETUP & ENVIRONMENT: Provide clear setup instructions with exact commands",
      "7. CONTRIBUTION GUIDE: Show new developers where they should focus their efforts",
      "",
      "SCENE DIVERSITY & STRUCTURE:",
      "- Scene 1: PROJECT OVERVIEW - What does this project do? Who uses it? Why does it exist?",
      "- Scene 2: ARCHITECTURE & KEY CONCEPTS - How is the system designed? What are main components?",
      "- Scene 3: DEEP TECHNICAL DIVE - Code structure, important files, key modules, data models",
      "- Scene 4: HOW IT WORKS - Data flow, request lifecycle, processing pipeline, core logic",
      "- Scene 5: SETUP & RUNNING - Prerequisites, installation, configuration, how to run locally",
      "- Scene 6 (optional): CONTRIBUTING - Where to start, important files to edit, coding standards",
      "",
      "NARRATION QUALITY:",
      "- Make narration engaging and conversational (like a senior engineer talking to you)",
      "- Include specific code examples and file paths",
      "- Explain WHY things are done, not just WHAT",
      "- Use clear technical language appropriate for developers",
      "- Each scene narration: 100-200 words (about 30-60 seconds of video)",
      "",
      "HIGHLIGHTS & VISUAL DESCRIPTIONS:",
      "- Include 2-3 key highlights per scene",
      "- Visual descriptions should be specific and actionable",
      "- Use 'code_highlight' type for showing important code snippets",
      "- Use 'diagram' type for architecture, flows, or relationships",
      "- Use 'folder_tree' type for showing project structure",
      "",
      "IMPORTANT:",
      "- Extract specific file paths from the code and mention them in narration",
      "- Explain the purpose and importance of each major component",
      "- Make it clear how a new developer should approach understanding this codebase",
      "- Total video target: 3-5 minutes of engaging content",
      "",
      "Repository context:",
      JSON.stringify(repoContext),
    ].join("\n");

    async function callOnce(extraInstruction?: string) {
      const contents = extraInstruction ? `${prompt}\n\n${extraInstruction}` : prompt;
      return await client.models.generateContent({
        model,
        contents,
        config: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      });
    }

    // Retry logic with exponential backoff for rate limits/overload
    let resp;
    const maxRetries = 3;
    let lastError: any = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        resp = await callOnce();
        break; // Success, exit retry loop
      } catch (err: any) {
        lastError = err;
        const errorMessage = err?.message || String(err);
        const isRateLimit = errorMessage.includes("overloaded") || 
                           errorMessage.includes("503") ||
                           errorMessage.includes("429") ||
                           errorMessage.includes("RESOURCE_EXHAUSTED") ||
                           errorMessage.includes("UNAVAILABLE");
        
        if (isRateLimit && attempt < maxRetries - 1) {
          // Exponential backoff: 2s, 4s, 8s
          const delayMs = Math.pow(2, attempt + 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue; // Retry
        } else {
          throw err; // Not retryable or out of retries
        }
      }
    }
    
    if (!resp) {
      throw lastError || new Error("Failed to generate content after retries");
    }
    const text = resp.text ?? "";

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      // One retry with a stricter instruction (still forcing JSON mime type)
      const retry = await callOnce(
        "IMPORTANT: Output MUST be valid JSON ONLY. Do not wrap in ``` and do not add any explanation.",
      );
      const retryText = retry.text ?? "";
      try {
        json = JSON.parse(retryText);
      } catch {
        // Try to salvage if model returned extra text
        const start = retryText.indexOf("{");
        const end = retryText.lastIndexOf("}");
        if (start >= 0 && end > start) {
          json = JSON.parse(retryText.slice(start, end + 1));
        } else {
          return NextResponse.json(
            { ok: false, error: "Model did not return JSON", raw: retryText || text },
            { status: 500 },
          );
        }
      }
    }

    // Try to parse and fix common issues
    let parsed = onboardingScriptSchema.safeParse(json);
    
    if (!parsed.success) {
      // Try to fix common issues: missing scenes array, missing required fields
      const fixed = { ...json } as any;
      
      // Ensure scenes array exists
      if (!fixed.scenes || !Array.isArray(fixed.scenes)) {
        fixed.scenes = [];
      }
      
      // Ensure projectName and oneLiner exist
      if (!fixed.projectName && (fixed as any).name) {
        fixed.projectName = (fixed as any).name;
      }
      if (!fixed.oneLiner && (fixed as any).description) {
        fixed.oneLiner = (fixed as any).description;
      }
      
      // Fix scenes: ensure id, title, narration exist
      fixed.scenes = fixed.scenes.map((s: any, idx: number) => ({
        id: s.id || `scene-${idx + 1}`,
        title: s.title || `Scene ${idx + 1}`,
        narration: s.narration || s.description || "",
        onScreenText: s.onScreenText || [],
        visual: s.visual || {
          type: "bullet_list",
          description: s.visual?.description || "",
          highlights: s.visual?.highlights || [],
        },
        durationSec: s.durationSec,
      }));
      
      // Retry parsing with fixed data
      parsed = onboardingScriptSchema.safeParse(fixed);
      
      if (!parsed.success) {
        // Last resort: return a minimal valid structure
        const minimal = {
          projectName: (fixed.projectName as string) || "Unknown Project",
          oneLiner: (fixed.oneLiner as string) || "A software project",
          techStack: fixed.techStack || [],
          architecture: fixed.architecture || { overview: "", keyModules: [] },
          setup: fixed.setup || { prerequisites: [], steps: [], runCommands: [] },
          contributorStartPoints: fixed.contributorStartPoints || [],
          scenes: fixed.scenes || [],
        };
        
        const finalParse = onboardingScriptSchema.safeParse(minimal);
        if (!finalParse.success) {
          return NextResponse.json(
            {
              ok: false,
              error: "Invalid JSON schema from model",
              issues: parsed.error.issues,
              raw: json,
              attemptedFix: fixed,
            },
            { status: 500 },
          );
        }
        parsed = finalParse;
      }
    }

    return NextResponse.json({
      ok: true,
      model,
      repo: { owner: ref.owner, repo: ref.repo, branch },
      picked,
      script: parsed.data,
    });
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    const isOverloaded = errorMessage.includes("overloaded") || errorMessage.includes("503");
    const isRateLimit = errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED");
    
    let userMessage = errorMessage;
    if (isOverloaded) {
      userMessage = "The Gemini API is currently overloaded. Please try again in a few moments.";
    } else if (isRateLimit) {
      userMessage = "Rate limit exceeded. Please wait a moment and try again.";
    }
    
    return NextResponse.json({ 
      ok: false, 
      error: userMessage,
      retryable: isOverloaded || isRateLimit,
    }, { status: 500 });
  }
}


