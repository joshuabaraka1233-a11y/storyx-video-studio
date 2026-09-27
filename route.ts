import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const duration = Math.min(60, Math.max(1, Number(body.duration) || 1));
  const title = String(body.title || 'Untitled Story').trim();
  const description = String(body.description || '').trim();
  const style = String(body.style || 'Cinematic Mystery');

  const project = {
    id: crypto.randomUUID(),
    title: title.slice(0, 80),
    description: description.slice(0, 1000),
    duration,
    style,
    status: 'Draft' as const,
    created: 'Just now',
    progress: 0,
  };

  return NextResponse.json({ project });
}
