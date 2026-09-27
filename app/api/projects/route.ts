import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const duration = Number(body.duration);
    if (!body.description || !Number.isFinite(duration) || duration < 1 || duration > 60) {
      return NextResponse.json({ error: 'Invalid project data.' }, { status: 400 });
    }
    return NextResponse.json({
      project: {
        id: crypto.randomUUID(),
        title: String(body.title || 'Untitled Story').slice(0, 100),
        description: String(body.description).slice(0, 5000),
        duration,
        style: String(body.style || 'Cinematic').slice(0, 80),
        status: 'Draft',
        created: 'Just now',
        progress: 0,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
