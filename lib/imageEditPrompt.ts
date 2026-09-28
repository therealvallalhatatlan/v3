export type ImageEditPromptInput = {
  instruction: string;
  characterNames?: string[];
  addedCharacterNames?: string[];
  recentEditInstructions?: string[];
  originalPrompt?: string;
};

export const IMAGE_EDIT_SYSTEM_INSTRUCTION = [
  'You are the image editing layer of a character-consistent illustration engine.',
  'Edit the provided image, do not recreate the scene from scratch.',
  'Make the smallest visual change necessary to satisfy the latest user request.',
  'Preserve all unrelated visual information exactly whenever possible.',
  'Preserve character identity, face, body proportions, clothing, accessories, distinctive features, composition, camera position, perspective, environment geometry, lighting structure, palette and texture unless the user explicitly asks to change one of them.',
  'When the user asks for a pose or position change, change only the requested character pose or placement while keeping identity and wardrobe intact.',
  'When the user asks to remove an object or person, naturally reconstruct the area behind it using the surrounding scene.',
  'When new reference images are supplied, treat them as authoritative visual references for the requested addition or modification, not as a reason to redesign the whole image.',
  'Do not introduce unrelated new objects, characters, styles, crops or camera changes.',
  'Return one concise confirmation sentence after the edited image.',
].join(' ');

export function buildImageEditPrompt(input: ImageEditPromptInput): string {
  const instruction = String(input.instruction || '').trim();
  if (!instruction) throw new Error('Edit instruction is empty.');

  const characterNames = (input.characterNames || []).map((name) => String(name || '').trim()).filter(Boolean);
  const addedCharacterNames = (input.addedCharacterNames || []).map((name) => String(name || '').trim()).filter(Boolean);
  const recent = (input.recentEditInstructions || []).map((item) => String(item || '').trim()).filter(Boolean).slice(-8);

  const sections: string[] = [
    'EDIT THE PROVIDED IMAGE.',
    '',
    'LATEST USER REQUEST:',
    instruction,
    '',
    'PRESERVATION CONTRACT:',
    '- Keep every part of the existing image unchanged unless the latest request requires it.',
    '- Do not reinterpret the original composition.',
    '- Do not replace the main character with a new person.',
    '- Keep the existing visual style and image quality.',
  ];

  if (characterNames.length) {
    sections.push('', `CHARACTERS ALREADY PRESENT IN THE IMAGE: ${characterNames.join(', ')}.`);
  }

  if (addedCharacterNames.length) {
    sections.push(
      '',
      `ADDITIONAL CHARACTER REFERENCES INCLUDED IN THIS TURN: ${addedCharacterNames.join(', ')}.`,
      'Use the matching reference image(s) to add or modify the named character while preserving the rest of the scene.',
    );
  }

  if (recent.length) {
    sections.push(
      '',
      'RECENT EDIT HISTORY FOR CONTEXT ONLY:',
      ...recent.map((item, index) => `${index + 1}. ${item}`),
      'The latest request has priority. Do not reapply an older request unless the latest request refers back to it.',
    );
  }

  if (input.originalPrompt?.trim()) {
    sections.push(
      '',
      'ORIGINAL GENERATION CONTEXT:',
      input.originalPrompt.trim().slice(0, 5000),
    );
  }

  sections.push(
    '',
    'Do not describe a new image. Actually edit the supplied image.',
    'Make the edit localized whenever possible.'
  );

  return sections.join('\n');
}

export function buildFallbackEditPrompt(input: ImageEditPromptInput): string {
  return [
    buildImageEditPrompt(input),
    '',
    'FALLBACK MODE:',
    'The previous conversational state may no longer be available. Treat the current supplied image as the complete visual source of truth and preserve it faithfully.',
  ].join('\n');
}
