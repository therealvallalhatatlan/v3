import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '../../../../lib/stripe';
import { createClient } from '@supabase/supabase-js';

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service-role configuration is missing');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 400 });
  }

  const payload = await request.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error: any) {
    console.error('Stripe webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as any;
  if (event.type === 'checkout.session.completed' && session.payment_status !== 'paid') {
    return NextResponse.json({ received: true, pending: true });
  }
  const userId = String(session.metadata?.userId || session.client_reference_id || '').trim();
  const packageId = String(session.metadata?.packageId || '').trim();
  const credits = Number(session.metadata?.credits || 0);
  const characterSlots = Number(session.metadata?.characterSlots || 0);
  const amountHuf = Number(session.metadata?.amountHuf || 0);

  if (!userId || !packageId || !Number.isInteger(credits) || credits <= 0 || !Number.isInteger(characterSlots) || characterSlots < 0 || !Number.isInteger(amountHuf) || amountHuf <= 0) {
    return NextResponse.json({ error: 'Invalid checkout metadata' }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase.rpc('apply_credit_purchase', {
    p_user_id: userId,
    p_stripe_payment_id: session.id,
    p_package_id: packageId,
    p_credits: credits,
    p_character_slots: characterSlots,
    p_amount: amountHuf,
    p_currency: String(session.currency || 'huf'),
  });

  if (error) {
    console.error('Purchase application failed:', error);
    return NextResponse.json({ error: 'Purchase could not be applied' }, { status: 500 });
  }

  return NextResponse.json({ received: true, applied: Boolean(data) });
}
