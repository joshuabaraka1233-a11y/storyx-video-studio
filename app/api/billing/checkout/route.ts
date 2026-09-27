import { NextResponse } from 'next/server';
import { CREDIT_PLANS } from '@/lib/billing';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { planId } = await request.json();
  const plan = CREDIT_PLANS.find((item) => item.id === planId);
  if (!plan) return NextResponse.json({ error: 'Unknown credit package.' }, { status: 400 });
  return NextResponse.json({
    mode: 'demo',
    plan: { id: plan.id, credits: plan.credits, priceKes: plan.priceKes },
    message: 'Development checkout only. Connect a real payment provider before launch.',
  });
}
