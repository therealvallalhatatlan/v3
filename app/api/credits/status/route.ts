export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '../../../../lib/stripe';
import { createSupabaseServerClient, getCurrentUser } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const sessionId = request.nextUrl.searchParams.get('session_id')?.trim();
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (session.client_reference_id !== user.id) {
      return NextResponse.json({ error: 'Checkout session does not belong to this user' }, { status: 403 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: purchase, error } = await supabase
      .from('purchases')
      .select('package_id, credits, character_slots, amount, currency, status, created_at')
      .eq('stripe_payment_id', session.id)
      .maybeSingle();

    if (error) {
      console.error('Purchase status lookup failed:', error);
      return NextResponse.json({ error: 'Unable to check purchase status' }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: session.id,
      checkoutStatus: session.status,
      paymentStatus: session.payment_status,
      fulfilled: Boolean(purchase && purchase.status === 'completed'),
      purchase: purchase || null,
    });
  } catch (error: any) {
    console.error('Stripe status error:', error);
    return NextResponse.json({ error: error?.message || 'Unable to check Stripe payment status' }, { status: 500 });
  }
}
