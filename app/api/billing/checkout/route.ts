import { NextResponse } from 'next/server';
import { CREDIT_PLANS } from '@/lib/billing';

export async function POST(request: Request) {
  const { planId } = await request.json();
  const plan = CREDIT_PLANS.find((item) => item.id === planId);

  if (!plan) return NextResponse.json({ error: 'Credit package not found.' }, { status: 400 });

  return NextResponse.json({
    mode: 'demo',
    message: `Demo checkout created for ${plan.name}. Connect your payment provider to collect KSh ${plan.priceKes}.`,
    plan,
  });
}
