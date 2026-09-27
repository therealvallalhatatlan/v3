import { NextRequest, NextResponse } from 'next/server';
import { getCreditPackages } from '../../../../lib/credits/packages';
import { getStripe } from '../../../../lib/stripe';
import { getCurrentUser } from '../../../../lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const packageId = String(body?.packageId || '').trim();
    const pack = getCreditPackages().find((item) => item.id === packageId);

    if (!pack) {
      return NextResponse.json({ error: 'Credit package not found' }, { status: 404 });
    }

    console.log('Stripe checkout package:', {
      id: pack.id,
      name: pack.name,
      credits: pack.credits,
      characterSlots: pack.characterSlots,
      amountHuf: pack.amountHuf,
    });

    if (!Number.isInteger(pack.amountHuf) || pack.amountHuf < 175) {
      return NextResponse.json(
        { error: 'Invalid package amount', packageId: pack.id, configuredAmountHuf: pack.amountHuf },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    const origin = req.nextUrl.origin;

    const stripeUnitAmount = pack.amountHuf * 100;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'huf',
            unit_amount: stripeUnitAmount,
            product_data: {
              name: pack.name,
              description: `${pack.credits} kredit${pack.characterSlots ? ` + ${pack.characterSlots} karakterhely` : ''}`,
            },
          },
        },
      ],
      metadata: {
        userId: user.id,
        packageId: pack.id,
        credits: String(pack.credits),
        characterSlots: String(pack.characterSlots),
        amountHuf: String(pack.amountHuf),
      },
      success_url: `${origin}/credits?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/credits?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error?.message || 'Unable to create checkout session' }, { status: 500 });
  }
}
