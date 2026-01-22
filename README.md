## OnboardAI

OnboardAI converts a **public GitHub repository URL** into a short, narrated onboarding video (2–3 minutes) that explains the project's purpose, architecture, setup, and where new contributors should start.

### Features

- ✅ **GitHub Repository Ingestion**: Automatically fetches README and key code files
- ✅ **AI-Powered Analysis**: Uses Gemini 3 to understand codebase architecture
- ✅ **Structured Script Generation**: Creates scene-by-scene onboarding scripts with narration
- ✅ **Visual Planning**: Suggests visuals for each scene (code highlights, diagrams, etc.)
- ✅ **Video Generation Pipeline**: Ready for TTS audio + visual rendering → MP4 output

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

### API Routes

- `POST /api/ingest` - Fetches repository files from GitHub
- `POST /api/script` - Generates onboarding script using Gemini
- `POST /api/video/render` - Video generation pipeline (returns asset structure)

### Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS
- **AI**: Google Gemini 3 (Flash/Pro)
- **Video**: Remotion (React-based video rendering)
- **GitHub**: Octokit REST API

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
