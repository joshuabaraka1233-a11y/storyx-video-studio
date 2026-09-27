# StoryX Video Studio

Standalone long-form AI video generation studio starter. No Lovable dependency.

## Run
npm install
npm run dev

## Architecture
The UI is designed around a scene-based pipeline so videos can scale to 60 minutes:
idea -> script -> scene plan -> visuals -> voice -> music/SFX -> timeline -> render -> MP4.

The current build includes a polished dashboard and project creation flow. AI provider adapters, authentication, database persistence, background render workers, storage, billing/credits, and real video generation are the next integration layer.
