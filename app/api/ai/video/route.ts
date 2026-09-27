import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const download = searchParams.get('download') === '1';
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured on the server.' }, { status: 503 });

    const endpoint = download
      ? 'https://api.openai.com/v1/videos/' + encodeURIComponent(id) + '/content'
      : 'https://api.openai.com/v1/videos/' + encodeURIComponent(id);
    const response = await fetch(endpoint, {
      headers: { Authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json({ error: data?.error?.message || 'Could not retrieve video job.' }, { status: response.status });
    }

    if (download) {
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'video/mp4',
          'Cache-Control': 'no-store',
        },
      });
    }

    const data = await response.json();
    return NextResponse.json({ video: data, provider: 'openai' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video retrieval failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = String(body.prompt || '').trim();
    const seconds = ['4','8','12'].includes(String(body.seconds)) ? String(body.seconds) : '8';
    const size = String(body.size || '1280x720');
    const model = process.env.OPENAI_VIDEO_MODEL || 'sora-2';

    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured on the server.' }, { status: 503 });

    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('seconds', seconds);
    form.append('size', size);

    const response = await fetch('https://api.openai.com/v1/videos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || 'Video generation request failed', details: data }, { status: response.status });

    return NextResponse.json({ video: data, provider: 'openai' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
