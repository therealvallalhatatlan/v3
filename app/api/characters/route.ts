
import { NextRequest, NextResponse } from 'next/server';
import { saveCharacter, getAllCharacters } from '../../../lib/storage';
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
