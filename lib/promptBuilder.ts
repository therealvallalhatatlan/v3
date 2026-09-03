import { CharacterDNA, SceneInput } from '../types/prompt';
import { Character } from '../types';
import { buildSceneBlock } from './sceneMapper';
import { getCamera } from './camera';
import { getStyleBlock, getNegativeBlock } from './style';

function extractAnchorPhrases(description: string): string[] {
  return description
    .split(/[,.;\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function buildAliasFromName(name: string, fallbackIndex: number): string {
  const initials = (name || '')
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('');
  if (initials) return initials;
  return `C${fallbackIndex + 1}`;
}

export function buildCharacterDNAFromCharacter(
  character: Character,
  alias?: string,
  aliasFallbackIndex = 0
): CharacterDNA {
  const traits = Array.from(
    new Set(
      (character.traits || [])
        .map((trait) => trait.trim())
        .filter(Boolean)
    )
  );
  const anchors = [
    ...extractAnchorPhrases(character.description),
    ...traits.map((trait) => `Trait: ${trait}`),
    ...(character.imagePaths?.length
      ? [`Uploaded reference images: ${character.imagePaths.length}`]
      : []),
  ];

  return {
    sourceCharacterId: character.id,
    alias: (alias || '').trim() || buildAliasFromName(character.name, aliasFallbackIndex),
    identity: {
      name: character.name,
      archetype: character.description || 'Unknown archetype',
    },
    physical: {
      face: character.description,
      body: 'Preserve the exact body shape and silhouette suggested by the reference images',
      posture: 'Keep the same overall stance and attitude as the reference set',
    },
    outfit: {
      top: `Preserve the exact signature upper-body outfit, costume pieces, and mask details described in identity text: ${character.description}`,
      bottom: `Preserve the exact lower-body costume structure and proportions described in identity text: ${character.description}`,
      accessories: traits,
    },
    anchors,
    texture: {
      material: 'Match the visual materials and surface treatment from the reference images',
      wear: 'Preserve wear, damage, and lived-in texture cues',
      dirt: 'Preserve dirt, grime, and patina as shown in the references',
    },
    energy: `Character energy derived from: ${traits.join(', ') || character.description}`,
    environmentAffinity: traits,
  };
}

export function buildIdentityBlock(character: CharacterDNA): string {
  return `
[IDENTITY]
Name: ${character.identity.name}
Archetype: ${character.identity.archetype}
`;
}

export function buildAnchorBlock(anchors: string[]): string {
  return `
[ANCHORS - DO NOT CHANGE]
${anchors.map(a => `- ${a}`).join('\n')}
`;
}

export function buildPhysicalBlock(character: CharacterDNA): string {
  return `
[PHYSICAL]
Face: ${character.physical.face}
Body: ${character.physical.body}
Posture: ${character.physical.posture}
Skin and phenotype: preserve the exact skin tone, undertone, ethnic facial features, and gender presentation defined by identity text and reference images; no phenotype drift
`;
}

export function buildOutfitBlock(character: CharacterDNA): string {
  return `
[OUTFIT]
Top: ${character.outfit.top}
Bottom: ${character.outfit.bottom}
Accessories: ${character.outfit.accessories.join(', ')}
`;
}

export function buildTextureBlock(character: CharacterDNA): string {
  return `
[TEXTURE]
Material: ${character.texture.material}
Wear: ${character.texture.wear}
Dirt: ${character.texture.dirt}
`;
}

export function buildEnergyBlock(character: CharacterDNA): string {
  return `
[ENERGY]
${character.energy}
`;
}

export function buildConstraintBlock(isMultiCharacter = false): string {
  return `
[STRICT CONSTRAINTS]
- reference images are the primary source of truth
- do not redesign the character
- do not change face structure
- preserve canonical demographics from identity/archetype text and references (skin tone, ethnicity, gender expression, age cues)
- if identity text explicitly states ethnicity or skin tone, enforce it exactly
- do not lighten or darken skin tone beyond what references and identity description define
- do not change mask shape
- do not change clothing type
- preserve proportions and silhouette
- preserve unique features, color blocking, and accessories
${isMultiCharacter
  ? '- all listed characters must appear in the same frame; none may be omitted'
  : '- same character, different scene only'}
`;
}

export function buildCastBlock(characters: CharacterDNA[]): string {
  return `
[CAST]
${characters.map((character) => `- ${character.alias}: ${character.identity.name}`).join('\n')}
`;
}

export function buildMultiCharacterConstraintBlock(characters: CharacterDNA[]): string {
  return `
[MULTI-CHARACTER CONSTRAINTS]
- render exactly ${characters.length} distinct characters in one shared frame
- every listed alias must be visible: ${characters.map((c) => c.alias).join(', ')}
- maintain each listed character as a separate, identifiable person
- do not merge character identities, faces, outfits, or silhouettes
- preserve role readability for each alias: ${characters.map((c) => c.alias).join(', ')}
- interaction can change pose, but identity and core design must remain locked
`;
}

export function buildCharacterMustIncludeBlock(character: CharacterDNA): string {
  const mustKeep = [
    ...(character.outfit.accessories || []).slice(0, 6),
    ...character.anchors.filter((anchor) => !anchor.startsWith('Uploaded reference images:')).slice(0, 4),
  ];

  const unique = Array.from(new Set(mustKeep.map((item) => item.trim()).filter(Boolean)));
  if (unique.length === 0) {
    return `[MUST INCLUDE ${character.alias}]\n- preserve signature visual identity from references`;
  }

  return `
[MUST INCLUDE ${character.alias}]
${unique.map((item) => `- ${item}`).join('\n')}
`;
}

// Optional: state modifier
export function buildStateModifier(state: 'normal' | 'high' | 'crash'): string {
  switch (state) {
    case 'high':
      return '[STATE]\nEnergy: heightened, visual intensity increased, colors more saturated, slight glow';
    case 'crash':
      return '[STATE]\nEnergy: depleted, visuals desaturated, posture slumped, environment bleak';
    default:
      return '[STATE]\nEnergy: baseline, visuals neutral';
  }
}

export function buildScenePackageMetaBlock(scene: SceneInput): string {
  const profileId = scene.locationProfileId || scene.scenePackage?.locationProfileId;
  const fingerprint = scene.locationFingerprint;
  if (!profileId && !fingerprint) return '';

  const lines: string[] = [];
  if (profileId) lines.push(`- locationProfileId: ${profileId}`);
  if (fingerprint) lines.push(`- locationFingerprint: ${fingerprint}`);

  return `
[SCENE PACKAGE META]
${lines.join('\n')}
`;
}

export function buildFinalPrompt(
  character: CharacterDNA,
  scene: SceneInput
): string {
  const blocks = [
    buildIdentityBlock(character),
    buildAnchorBlock(character.anchors),
    buildPhysicalBlock(character),
    buildOutfitBlock(character),
    buildTextureBlock(character),
    buildEnergyBlock(character),
    buildSceneBlock(scene),
    buildScenePackageMetaBlock(scene),
    getCamera(scene.camera),
    getStyleBlock(scene.style, scene.styleIntensity),
    buildConstraintBlock(),
    getNegativeBlock(scene.style, scene.styleIntensity),
  ].filter(Boolean);
  return blocks.join('\n\n');
}

export function buildFinalPromptMulti(
  characters: CharacterDNA[],
  scene: SceneInput
): string {
  const blocks: string[] = [
    buildCastBlock(characters),
    `[MULTI SUBJECT GOAL]\nRender all listed characters together in the same moment and environment. Do not drop or replace any alias.`,
  ];

  for (const character of characters) {
    blocks.push(`[CHARACTER ${character.alias}]`);
    blocks.push(buildIdentityBlock(character));
    blocks.push(buildAnchorBlock(character.anchors));
    blocks.push(buildPhysicalBlock(character));
    blocks.push(buildOutfitBlock(character));
    blocks.push(buildTextureBlock(character));
    blocks.push(buildEnergyBlock(character));
    blocks.push(buildCharacterMustIncludeBlock(character));
  }

  blocks.push(buildSceneBlock(scene));
  blocks.push(buildScenePackageMetaBlock(scene));
  blocks.push(getCamera(scene.camera));
  blocks.push(getStyleBlock(scene.style, scene.styleIntensity));
  blocks.push(buildConstraintBlock(true));
  blocks.push(buildMultiCharacterConstraintBlock(characters));
  blocks.push(getNegativeBlock(scene.style, scene.styleIntensity));

  return blocks.join('\n\n');
}
