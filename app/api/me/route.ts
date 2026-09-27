import { NextResponse } from 'next/server';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ authenticated: false });

  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('plan, generation_credits, character_slots')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Unable to load account' }, { status: 500 });

  return NextResponse.json({
    authenticated: true,
    user: { id: user.id, email: user.email },
    plan: profile?.plan || 'free',
    generationCredits: profile?.generation_credits || 0,
    characterSlots: profile?.character_slots || 0,
  });
}
