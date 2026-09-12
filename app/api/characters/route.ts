import { NextRequest, NextResponse } from 'next/server';
import { deleteCharacter, saveCharacter, getAllCharacters } from '../../../lib/storage';
import { Character } from '../../../types';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  return NextResponse.json(getAllCharacters());
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { name, description, traits, imageUrls } = data;
  const character: Character = {
    id: uuidv4(),
    name,
    description,
    traits,
    imagePaths: imageUrls || [],
    createdAt: Date.now(),
  };
  saveCharacter(character);
  return NextResponse.json(character);
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || '').trim();

    if (!id) {
      return NextResponse.json({ error: 'Missing character id' }, { status: 400 });
    }

    const character = getAllCharacters().find((item) => item.id === id);
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    deleteCharacter(id);
    return NextResponse.json({ ok: true, id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete character' },
      { status: 500 }
    );
  }
}
