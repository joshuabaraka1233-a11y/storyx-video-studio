# StoryX Video Studio

Standalone long-form AI video generation studio. No Lovable dependency.

## Run
npm install
npm run dev

## AI engine
StoryX now includes server-side OpenAI integration points:
- `POST /api/ai/storyboard` creates a structured scene plan from an idea.
- `POST /api/ai/video` starts a Sora video-generation job for an individual scene.
- API keys stay server-side in `.env.local`.

The video API generates short clips (currently 4, 8, or 12 seconds per job), so StoryX is designed to build long-form productions from many scene/shot jobs rather than requesting a 60-minute clip in one call.

## Local AI setup
1. Copy `.env.example` to `.env.local`.
2. Add your server-side `OPENAI_API_KEY`.
3. Run `npm install`.
4. Run `npm run dev`.

Never put an API key in client-side React code or commit `.env.local`.

## Architecture
idea -> AI script/storyboard -> scene plan -> short video shots -> voice -> music/SFX -> timeline -> render -> MP4.

The current build includes the premium dashboard, motion system, video preview, project creation flow, credits UI, and the first real AI backend endpoints. Authentication, persistent database/credits, production job queue, media storage, voice/music providers, FFmpeg assembly, and real payment processing remain to be connected.
