import { SceneInput } from '../types/prompt';
import { getCustomPreset } from './presetStore';

export const CAMERA_PRESETS: Record<string | SceneInput["camera"], string> = {
  closeup:
    "cinematic close-up portrait, subject fills frame, razor focus on eyes and facial details, shallow depth of field, creamy bokeh, soft directional key light with subtle rim light, emotionally intense and painterly composition",
  wide:
    "cinematic wide establishing shot, strong environmental storytelling, balanced foreground-midground-background layering, dramatic perspective depth, atmospheric haze, controlled contrast lighting, filmic color grading and art-directed composition",
  fisheye:
    "stylized fisheye lens shot, dynamic curvature and exaggerated perspective, bold composition lines, energetic visual tension, controlled edge distortion (subject remains readable), high-impact cinematic framing with artistic intent",
  handheld:
    "documentary-style handheld framing, slight natural camera sway, organic imperfections, cinematic realism, soft motion character without heavy blur",
  dutch:
    "cinematic dutch angle shot, intentional tilted horizon for psychological tension, bold diagonal composition, dramatic contrast, stylized thriller-like visual energy",
  birdseye:
    "bird's-eye top-down shot, geometric composition from high altitude, strong shape language, scene choreography clearly visible, atmospheric cinematic depth",
  overtheshoulder:
    "over-the-shoulder cinematic framing, foreground shoulder silhouette for depth, subject focus in midground, narrative POV tension, filmic blocking and lighting continuity",
  wormseye:
    "worm's-eye ultra low-angle shot from near ground level, towering perspective, heroic scale, dramatic sky/background separation, powerful cinematic presence",
  speedcam1999:
    "fixed roadside police speed camera framing from late 1990s Hungary, slightly elevated telephoto angle aimed at lane center, rigid tripod-like composition, night xenon flash exposure, practical evidence capture priorities over artistry, subject vehicle centered with readable plate zone, official enforcement-photo geometry",
  'security-cam':
    "fixed elevated security camera framing, institutional surveillance realism, static composition with practical wide coverage, flat perspective priority over cinematic dramatization, late-1990s public-space monitoring aesthetic, subject and pathways clearly readable",
  'telephoto-stakeout':
    "long-lens telephoto stakeout framing from distant vantage point, compressed perspective, voyeuristic observational mood, narrow depth plane with soft far-background blur, subtle atmospheric shimmer, subject readable but emotionally distant",
  'cctv-distorted':
    "CCTV fisheye surveillance framing with controlled barrel distortion, wide hemispherical field, archive-footage realism, mild signal-loss texture and practical timestamp aesthetic, environment remains readable despite lens curvature",
  'reflection-pov':
    "subjective reflection POV through mirror or glass surface, slight edge warping and layered reflections, psychological intimacy with voyeuristic tension, foreground reflective plane preserved while main subject remains identity-accurate",
  'macro-forensic':
    "extreme macro forensic detail framing, isolate tiny evidence-level textures with razor-sharp focus plane, dramatic depth falloff, investigative documentation mood, tactile material realism with disciplined composition",
  'pov-dashboard':
    "in-vehicle dashboard POV framing from driver-height perspective, windshield glare and practical reflections, analog late-1990s interior cues, forward road depth and motion context preserved, documentary driving-surveillance realism",
  'atm-lens':
    "ultra-wide distorted ATM hidden camera perspective, harsh greenish fluorescent lighting, low-res CRT monitor aesthetic, extreme paranoid surveillance framing, uncomfortably close midriff/face cutoff, digital artifacting",
  'fpv-kamikaze':
    "aggressive FPV drone dive perspective, extreme motion blur on edges, violent dutch tilt, hyper-kinetic dynamic tension, split-second before impact framing, digital transmission glitching and signal degradation",
  'peephole-voyeur':
    "distorted optical peephole POV, extreme circular barrel distortion, claustrophobic vignette framing, dirty glass texture, high-contrast grimy hallway lighting, paranoid psychological thriller aesthetic",
  'thermal-predator':
    "FLIR thermal imaging camera perspective, high-contrast heat signature mapping, monochromatic or false-color infrared spectrum, clinical military targeting aesthetic, dehumanizing voyeuristic distance",
  'vhs-glitch-90s':
    "home video camcorder aesthetic from 1995, severe chromatic aberration, RGB channel shift, tracking lines, blown-out highlights, analog tape degradation, subjective shaky-cam intimacy, raw underground vibe",
  'bodycam-raid':
    "chest-mounted tactical bodycam perspective, chaotic wide-angle framing, harsh tactical flashlight illumination piercing absolute darkness, visceral frantic movement, raw unpolished true-crime aesthetic, partial arm/weapon in foreground",
};

export function getCamera(camera: SceneInput["camera"] | string): string {
  const presetKey = String(camera || 'wide');
  const builtIn = CAMERA_PRESETS[presetKey];
  const custom = getCustomPreset('camera', presetKey);
  return `[CAMERA]\n${builtIn || custom?.prompt || CAMERA_PRESETS.closeup}`;
}