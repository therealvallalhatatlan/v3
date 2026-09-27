import { NextResponse } from 'next/server';
import { getCreditPackages } from '../../../../lib/credits/packages';
import { getCurrentUser } from '../../../../lib/supabase/server';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  return NextResponse.json({ packages: getCreditPackages() });
}
