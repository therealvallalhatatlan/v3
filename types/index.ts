export interface Character {
  id: string;
  name: string;
  description: string;
  traits: string[];
  imagePaths: string[];
  createdAt: number;
  type?: 'system' | 'user';
  ownerId?: string | null;
}

export interface SceneRequest {
  characterId?: string;
  characterIds?: string[];
  aliasMap?: Record<string, string>;
  location: string;
  lighting?: string;
  /** @deprecated Use lighting instead. */
  mood?: string;
  camera: string;
  aspectRatio?: 'landscape-16-9' | 'portrait-9-16';
  actionPrompt?: string;
  scenePackage?: {
    locationProfileId?: string;
    locationProfile: {
      preset: string;
      detail: string;
      geometry: string;
      lightingAndTime: string;
      paletteAndTexture: string;
      fixedProps: string;
      cameraContinuity: string;
    };
    continuity: {
      lockGeometry: boolean;
      lockLighting: boolean;
      lockPalette: boolean;
      lockProps: boolean;
      lockCameraRules: boolean;
      notes?: string;
    };
    shotTemplate?: string;
    bilingualInput?: {
      sourceLanguage: 'hu' | 'en' | 'mixed';
    };
  };
}
