'use client';

import { useEffect } from 'react';

const TEXT_MAP: Record<string, string> = {
  Characters: 'Karakterek',
  'Create Character': 'Karakter létrehozása',
  Presets: 'Presetek',
  'Main navigation': 'Fő navigáció',
  'Create Character': 'Karakter létrehozása',
  'Loading...': 'Betöltés...',
  'Generate Presets and Auto-Restore': 'Generálási presetek és automatikus visszaállítás',
  'Manage Location / Camera / Style': 'Helyszín / kamera / stílus kezelése',
  'Preset name': 'Preset neve',
  'Character presets': 'Karakterpresetek',
  'Global presets': 'Globális presetek',
  'Select...': 'Válassz...',
  'Save New': 'Új mentése',
  Overwrite: 'Felülírás',
  Load: 'Betöltés',
  Delete: 'Törlés',
  'Set as default': 'Beállítás alapértelmezettként',
  Location: 'Helyszín',
  'Location Preset': 'Helyszínpreset',
  'Location Profile Continuity': 'Helyszínprofil folytonossága',
  'Spatial geometry and layout': 'Térbeli geometria és elrendezés',
  'Lighting and time of day': 'Fényelés és napszak',
  'Palette and textures': 'Színpaletta és textúrák',
  'Fixed props and positions': 'Fix kellékek és pozíciók',
  'Camera continuity rules': 'Kamerafolytonossági szabályok',
  'Shot Template': 'Beállítássablon',
  'Lock geometry': 'Geometria rögzítése',
  'Lock lighting': 'Fényelés rögzítése',
  'Lock palette': 'Paletta rögzítése',
  'Lock props': 'Kellékek rögzítése',
  'Lock camera rules': 'Kameraszabályok rögzítése',
  'Continuity notes': 'Folytonossági megjegyzések',
  Mood: 'Hangulat',
  Add: 'Hozzáadás',
  Alias: 'Álnév',
  Remove: 'Eltávolítás',
  'Shared action prompt': 'Közös akcióleírás',
  Camera: 'Kamera',
  Style: 'Stílus',
  'Style Intensity:': 'Stílus intenzitása:',
  'Compare with second style (A/B)': 'Összehasonlítás második stílussal (A/B)',
  'Compare Style': 'Összehasonlító stílus',
  'Generate Scene': 'Jelenet generálása',
  'Generating…': 'Generálás…',
  'Animate this image': 'Kép animálása',
  'Animate A': 'A animálása',
  'Animate B': 'B animálása',
  'No generated images yet.': 'Még nincs generált kép.',
  'Generate': 'Generálj',
  'Select a source image first.': 'Először válassz forrásképet.',
  'Motion prompt is too short.': 'A mozgásleírás túl rövid.',
  'Failed to create animation job': 'Nem sikerült létrehozni az animációs feladatot.',
  'Submitting…': 'Küldés…',
  'In Progress': 'Folyamatban',
  'Auto-refreshing every 5s…': 'Automatikus frissítés 5 másodpercenként…',
  Cancel: 'Mégse',
  Results: 'Eredmények',
  Download: 'Letöltés',
  'Source image': 'Forráskép',
  Selected: 'Kiválasztva',
  'Loading gallery...': 'Galéria betöltése...',
  'No generated images yet.': 'Még nincs generált kép.',
  Prev: 'Előző',
  Next: 'Következő',
  Close: 'Bezárás',
  Refresh: 'Frissítés',
  'Try again': 'Újrapróbálás',
  Reload: 'Újratöltés',
  'Something went wrong': 'Hiba történt',
  'An unexpected error occurred while rendering this route.': 'Váratlan hiba történt az oldal megjelenítése közben.',
  'Application error': 'Alkalmazáshiba',
  'A root-level error occurred.': 'Alkalmazásszintű hiba történt.',
  'Open image preview': 'Kép előnézetének megnyitása',
  'Image preview, use left and right arrow keys to navigate': 'Kép előnézete, a bal és jobb nyíllal lehet lépkedni',
};

function translateTextNode(node: Text) {
  const value = node.nodeValue;
  if (!value) return;
  const trimmed = value.trim();
  if (!trimmed) return;

  if (TEXT_MAP[trimmed]) {
    node.nodeValue = value.replace(trimmed, TEXT_MAP[trimmed]);
    return;
  }

  const relative = trimmed.match(/^(\d+)([mhd]) ago$/);
  if (relative) {
    const [, amount, unit] = relative;
    const translatedUnit = unit === 'm' ? 'perce' : unit === 'h' ? 'órája' : 'napja';
    node.nodeValue = `${amount} ${translatedUnit}`;
    return;
  }

  const statusMap: Record<string, string> = {
    queued: 'sorban',
    processing: 'feldolgozás alatt',
    done: 'kész',
    failed: 'sikertelen',
    canceled: 'megszakítva',
  };
  if (statusMap[trimmed]) {
    node.nodeValue = statusMap[trimmed];
  }
}

function translateAttributes(element: Element) {
  for (const name of ['aria-label', 'title', 'placeholder']) {
    const value = element.getAttribute(name);
    if (value && TEXT_MAP[value.trim()]) {
      element.setAttribute(name, TEXT_MAP[value.trim()]);
    }
  }
}

function translateTree(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    translateTextNode(node as Text);
    node = walker.nextNode();
  }
  if (root instanceof Element) translateAttributes(root);
  if (root instanceof ParentNode) {
    root.querySelectorAll('*').forEach(translateAttributes);
  }
}

export default function HungarianUi() {
  useEffect(() => {
    document.documentElement.lang = 'hu';
    translateTree(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => translateTree(node));
        if (mutation.type === 'characterData') translateTextNode(mutation.target as Text);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
