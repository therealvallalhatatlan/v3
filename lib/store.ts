import { Character } from '../types';

let characters: Character[] = [];

export function addCharacter(character: Character) {
  characters.push(character);
}

export function getCharacters(): Character[] {
  return characters;
}

export function getCharacterById(id: string): Character | undefined {
  return characters.find((c) => c.id === id);
}
