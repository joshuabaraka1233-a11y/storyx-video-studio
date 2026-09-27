import { NextResponse } from 'next/server';
import OpenAI from 'openai';

type Scene = {
  scene: number;
  title: string;
  durationSeconds: number;
  location: string;
  characters: string[];
  visualPrompt: string;
  narration: string;
  camera: string;
  mood: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idea = String(body.idea || '').trim();
    const minutes = Math.max(1, Math.min(60, Number(body.duration || 1)));
    const style = String(body.style || 'Cinematic Mystery');

    if (!idea) return NextResponse.json({ error: 'idea is required' }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured on the server.' }, { status: 503 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const targetScenes = Math.max(4, Math.min(60, Math.ceil(minutes / 2)));

    const prompt = `You are the StoryX showrunner and visual director. Turn this idea into a production-ready scene plan.
Idea: ${idea}
Style: ${style}
Target duration: ${minutes} minutes.
Create exactly ${targetScenes} scenes. Each scene should be a self-contained visual beat that can later become a 4/8/12-second generated clip or be extended through multiple shots.
Return ONLY valid JSON with this shape:
{"title":"...","logline":"...","scenes":[{"scene":1,"title":"...","durationSeconds":30,"location":"...","characters":["..."],"visualPrompt":"...","narration":"...","camera":"...","mood":"..."}]}
Keep character names and visual details consistent across scenes. Do not use markdown fences.`;

    const response = await client.responses.create({
      model: process.env.OPENAI_TEXT_MODEL || 'gpt-5.6-luna',
      input: prompt,
    });

    const raw = response.output_text.trim().replace(/^\`\`\`json\s*/,'').replace(/\s*\`\`\`$/,'');
    const plan = JSON.parse(raw);
    return NextResponse.json({ plan, provider: 'openai', model: process.env.OPENAI_TEXT_MODEL || 'gpt-5.6-luna' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Storyboard generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
