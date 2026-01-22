import { z } from "zod";

// More lenient schema that handles missing fields gracefully
export const onboardingScriptSchema = z.object({
  projectName: z.string(),
  oneLiner: z.string(),
  techStack: z.array(z.string()).optional().default([]),
  architecture: z
    .object({
      overview: z.string().optional().default(""),
      keyModules: z
        .array(
          z.object({
            name: z.string(),
            responsibility: z.string(),
            files: z.array(z.string()).optional().default([]),
          }),
        )
        .optional()
        .default([]),
      dataFlow: z.string().optional(),
    })
    .optional()
    .default({ overview: "", keyModules: [] }),
  setup: z
    .object({
      prerequisites: z.array(z.string()).optional().default([]),
      steps: z.array(z.string()).optional().default([]),
      runCommands: z.array(z.string()).optional().default([]),
    })
    .optional()
    .default({ prerequisites: [], steps: [], runCommands: [] }),
  contributorStartPoints: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        suggestedFiles: z.array(z.string()).optional().default([]),
      }),
    )
    .optional()
    .default([]),
  scenes: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      narration: z.string(),
      onScreenText: z.array(z.string()).optional().default([]),
      visual: z
        .object({
          type: z
            .enum(["title", "folder_tree", "diagram", "code_highlight", "bullet_list"])
            .or(z.string())
            .transform((val) => {
              const valid = ["title", "folder_tree", "diagram", "code_highlight", "bullet_list"];
              return valid.includes(val) ? val : "bullet_list";
            }),
          description: z.string(),
          highlights: z.array(z.string()).optional().default([]),
        })
        .optional()
        .default({ type: "bullet_list", description: "", highlights: [] }),
      durationSec: z.number().min(5).max(60).optional(),
    }),
  ),
});

export type OnboardingScript = z.infer<typeof onboardingScriptSchema>;


