export type LightingPreset = {
  value: string;
  label: string;
  prompt: string;
};

export const LIGHTING_PRESETS: LightingPreset[] = [
  { value: 'dawn', label: 'Napszak · Hajnal', prompt: 'pre-sunrise dawn light, cool ambient sky, very low warm horizon glow, soft long shadows' },
  { value: 'sunrise', label: 'Napszak · Napkelte', prompt: 'low sunrise light, warm directional sunlight, long shadows, gentle atmospheric falloff' },
  { value: 'golden-hour', label: 'Napszak · Aranyóra', prompt: 'low warm sunlight, long directional shadows, gentle golden edge illumination, soft atmospheric depth' },
  { value: 'midday-hard-sun', label: 'Napszak · Kemény déli nap', prompt: 'high midday sun, hard short shadows, strong overhead illumination, crisp direct sunlight' },
  { value: 'afternoon-soft', label: 'Napszak · Késő délután', prompt: 'late-afternoon sunlight, warm directional light, medium-length shadows, natural falloff' },
  { value: 'sunset', label: 'Napszak · Napnyugta', prompt: 'low sunset light, warm horizon glow, long shadows, fading ambient illumination' },
  { value: 'blue-hour', label: 'Napszak · Kékóra', prompt: 'blue-hour ambient light, cool sky illumination, very soft contrast, fading warm practical light' },
  { value: 'night-natural', label: 'Napszak · Tiszta éjszaka', prompt: 'nighttime ambient darkness with restrained practical illumination and readable shadow detail' },

  { value: 'spring-light', label: 'Évszak · Tavasz', prompt: 'fresh spring daylight, soft cool-neutral sun, clean atmospheric air, moderate contrast' },
  { value: 'summer-light', label: 'Évszak · Nyár', prompt: 'bright summer daylight, high sun, warmer ambient fill, defined natural shadows' },
  { value: 'autumn-light', label: 'Évszak · Ősz', prompt: 'low autumn sun, muted warm daylight, longer shadows, slightly hazy atmosphere' },
  { value: 'winter-low-sun', label: 'Évszak · Tél', prompt: 'low winter sunlight, cool ambient fill, long crisp shadows, pale diffuse sky' },

  { value: 'overcast', label: 'Természetes · Borult ég', prompt: 'fully overcast diffuse daylight, very soft shadows, broad even illumination, low directional contrast' },
  { value: 'fog-diffused', label: 'Természetes · Ködös szórt fény', prompt: 'fog-diffused light, reduced contrast, broad soft illumination, visible atmospheric depth' },
  { value: 'window-light', label: 'Belső · Ablakfény', prompt: 'natural window light from one side, soft directional illumination, gradual shadow falloff' },
  { value: 'window-backlight', label: 'Belső · Ablakból ellenfény', prompt: 'strong backlight from a window behind the subject, luminous edges, controlled foreground exposure' },
  { value: 'top-light', label: 'Irány · Felülről', prompt: 'predominantly top-down illumination, clear downward shadow direction, defined planes and facial relief' },
  { value: 'side-light', label: 'Irány · Oldalfény', prompt: 'strong lateral side light, pronounced light-to-shadow separation, dimensional facial and surface modeling' },
  { value: 'backlight-silhouette', label: 'Irány · Erős ellenfény', prompt: 'strong backlight behind the subject, bright source separation, foreground partially silhouetted while preserving readable contours' },
  { value: 'diffused-softbox', label: 'Mesterséges · Szórt lágy fény', prompt: 'large diffused soft light source, broad soft shadows, smooth tonal transition across the subject' },
  { value: 'hard-single-source', label: 'Mesterséges · Egyetlen kemény fény', prompt: 'single hard directional light source, deep defined shadows, high local contrast and clear shadow edges' },
  { value: 'practical-lamps', label: 'Belső · Gyakorlati fényforrások', prompt: 'illumination primarily from visible practical lamps and fixtures in the scene, localized pools of light and natural falloff' },
  { value: 'fluorescent-overhead', label: 'Belső · Mennyezeti fénycsövek', prompt: 'cool overhead fluorescent fixtures, broad top illumination, modest shadow definition, uneven practical falloff' },
  { value: 'sodium-vapor', label: 'Projekt · Nátriumlámpa', prompt: 'old sodium-vapor street lighting, localized warm pools of illumination, deep surrounding falloff, wet-surface reflection response' },
  { value: 'mercury-vapor', label: 'Projekt · Higanygőzlámpa', prompt: 'older mercury-vapor street lighting, pale cool-green directional pools, deep surrounding darkness, practical urban falloff' },
  { value: 'candlelight', label: 'Projekt · Gyertyafény', prompt: 'very low-level candlelight, small warm moving sources, deep soft shadow fields, rapid light falloff' },
  { value: 'dramatic-chiaroscuro', label: 'Dramatikus · Chiaroscuro', prompt: 'strong chiaroscuro lighting, concentrated directional light against substantial shadow mass, deliberate high tonal separation' },
  { value: 'split-light', label: 'Dramatikus · Félbevágott fény', prompt: 'near-split lighting, one side of the face and subject strongly illuminated while the opposite side falls into shadow' },
  { value: 'rim-light', label: 'Dramatikus · Peremfény', prompt: 'distinct rear or side rim light separating the subject from the background, restrained front fill' },
  { value: 'volumetric-shafts', label: 'Atmoszféra · Fénysugarak', prompt: 'visible volumetric light shafts through haze or dust, directional beams with readable atmospheric depth' },
  { value: 'bokeh-practical', label: 'Optikai · Bokeh fények', prompt: 'small practical point lights rendered as pronounced background bokeh, shallow depth of field, subject plane remains clear' },
  { value: 'broken-light', label: 'Optikai · Tördelt fény', prompt: 'interrupted hard light passing through blinds, leaves, railings, or irregular openings, broken shadow patterns across the scene' },
  { value: 'reflected-light', label: 'Optikai · Visszavert fény', prompt: 'secondary reflected bounce light from nearby surfaces, subtle indirect illumination with gentle fill' },
];

export function getLightingPreset(value: string | undefined): LightingPreset | undefined {
  if (!value) return undefined;
  return LIGHTING_PRESETS.find((preset) => preset.value === value);
}
