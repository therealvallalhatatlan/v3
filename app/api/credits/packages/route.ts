import { NextResponse } from 'next/server';
import { getCreditPackages } from '../../../../lib/credits/packages';
export async function GET() {
  return NextResponse.json({ packages: getCreditPackages() });
}
