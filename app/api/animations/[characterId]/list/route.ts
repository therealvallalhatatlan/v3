import { NextRequest, NextResponse } from 'next/server';
import { listAnimationJobs } from '../../../../../lib/storage';

export async function GET(req: NextRequest, { params }: { params: { characterId: string } }) {
  const { characterId } = params;
  if (!characterId) {
    return NextResponse.json({ error: 'Missing characterId' }, { status: 400 });
  }

  const jobs = listAnimationJobs(characterId);
  return NextResponse.json({ jobs });
}
