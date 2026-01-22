## OnboardAI

> Built for the **Gemini Hackathon 2026**

🔗 Live Demo: https://onboard-ai-gemini-hackathon.vercel.app/

OnboardAI turns a **public GitHub repository URL** into a short, narrated **onboarding video (2–3 minutes)** that explains what a project does, how it is structured, how to run it, and where to start exploring the code.

The goal is to make **GitHub repositories easier to understand** by converting real codebases into clear, visual walkthroughs—similar to having someone explain the project to you step by step.



## What This App Does

1. Accepts a **public GitHub repository URL**
2. Fetches key repository files (README, config files, important source files)
3. Uses **Google Gemini 3** to:
   - Understand the codebase
   - Infer architecture and data flow
   - Identify setup steps and entry points
4. Generates a **scene-by-scene onboarding script**
5. Converts the script into:
   - Narrated audio (TTS)
   - Structured visual frames
   - A final **MP4 onboarding video**



## Features

- ✅ **GitHub Repository Ingestion**  
  Automatically fetches README, dependency files, and key source files from public GitHub repositories

- ✅ **AI-Powered Code Understanding**  
  Uses **Gemini 3** for long-context reasoning over real-world codebases

- ✅ **Structured Onboarding Script**  
  Scene-by-scene narration covering:
  - Project overview
  - Architecture
  - Setup instructions
  - Contribution and exploration starting points

- ✅ **Visual-First Video Design**  
  Video frames highlight:
  - Architecture flow
  - Key concepts
  - Important ideas (without repeating narration text)

- ✅ **Automated Video Generation Pipeline**  
  Combines visuals and narration into a final MP4 onboarding video


## Who Is This For?

OnboardAI is designed for **anyone who wants to quickly understand what a GitHub repository does**, not just experienced developers.

It is especially useful for:

- 👩‍💻 **Developers & New Hires**  
  Get up to speed on an unfamiliar codebase in minutes instead of hours.

- 🎓 **Students & Learners**  
  Understand coursework repositories, open-source projects, and real-world codebases through clear, narrated explanations.

- 🌍 **Open-Source Contributors**  
  Quickly grasp project structure, setup steps, and where to start contributing.

- 🧠 **Non-Technical or Semi-Technical Users**  
  Get a high-level understanding of what a project does without reading thousands of lines of code.

- ⚡ **Hackathon Teams & Freelancers**  
  Rapidly evaluate repositories and onboard collaborators faster.



## Tech Stack

### Frontend
- **Next.js (App Router)**
- **React**
- **Tailwind CSS**

### AI & Reasoning
- **Google Gemini 3 (Flash / Pro)**
  - Long-context code understanding
  - Structured JSON output
  - Script and scene generation

### GitHub Integration
- **GitHub REST API (Octokit)**
- Supports public repositories (no authentication required)

### Video Generation
- **Canvas (node-canvas)** – generates visual frames
- **Text-to-Speech (TTS)** – generates narration audio
- **FFmpeg** – assembles frames and audio into MP4 videos

### Backend
- **Node.js**
- **Next.js API Routes**



## API Routes

- `POST /api/ingest`  
  Fetches repository structure and key files from GitHub

- `POST /api/script`  
  Uses Gemini 3 to generate the onboarding script and scene structure

- `POST /api/video/render`  
  Generates visual frames, audio narration, and assembles the final video




## Getting Started

First, run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` with your browser.

## Environment Variables

Create a `.env.local` file in the project root and set:

- **`GEMINI_API_KEY`**: Your API key from Google AI Studio (required)
- **`GITHUB_TOKEN`**: Optional GitHub personal access token for higher rate limits


## Product Preview

| Homepage | Generate Page |
|---------|---------------|
| ![Homepage](assets/homepage.png) | ![Generate Page](assets/generationpage.png) |

| Example Output | Example Output (Detailed) |
|---------------|---------------------------|
| ![Example Output](assets/example_output.png) | ![Example Output Detailed](assets/example_output1.png) |
