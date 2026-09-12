'use client';

import { useEffect } from 'react';

const TEXT_MAP: Record<string, string> = {
  Characters: 'Karakterek',
  'Create Character': 'Karakter létrehozása',
  Presets: 'Presetek',
  'Main navigation': 'Fő navigáció',
  'Loading...': 'Betöltés...',
  'Loading…': 'Betöltés…',
  'Generate Presets and Auto-Restore': 'Generálási presetek és automatikus visszaállítás',
  'Manage Location / Camera / Style': 'Helyszín / kamera / stílus kezelése',
  'Preset name': 'Preset neve',
  'Character presets': 'Karakterpresetek',
  'Global presets': 'Globális presetek',
  'Select...': 'Válassz...',
  Overwrite: 'Felülírás',
  Load: 'Betöltés',
  Delete: 'Törlés',
  'Save New': 'Új mentése',
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
  Generate: 'Generálás',
  'Select a source image first.': 'Először válassz forrásképet.',
  'Motion prompt is too short.': 'A mozgásleírás túl rövid.',
  'Failed to create animation job': 'Nem sikerült létrehozni az animációs feladatot.',
  'Failed to cancel': 'Nem sikerült megszakítani a feladatot.',
  'Submitting…': 'Küldés…',
  'In Progress': 'Folyamatban',
  'Auto-refreshing every 5s…': 'Automatikus frissítés 5 másodpercenként…',
  Cancel: 'Mégse',
  Results: 'Eredmények',
  Download: 'Letöltés',
  'Source image': 'Forráskép',
  Selected: 'Kiválasztva',
  'Loading gallery...': 'Galéria betöltése...',
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
  'Choose a source image': 'Válassz forrásképet',
  '2. Motion prompt': '2. Mozgásleírás',
  '3. Duration': '3. Időtartam',
  'Auto (AI decides)': 'Automatikus (az AI dönti el)',
  '4 seconds': '4 másodperc',
  '5 seconds': '5 másodperc',
  '6 seconds': '6 másodperc',
  '8 seconds': '8 másodperc',
  '10 seconds': '10 másodperc',
  '12 seconds': '12 másodperc',
  '15 seconds': '15 másodperc',
  Failed: 'Sikertelen',
  Canceled: 'Megszakítva',
  'No animation jobs yet. Select an image above and submit.': 'Még nincs animációs feladat. Válassz egy képet fent, majd indítsd el.',
  'Részletes helyszínleírás HU/EN.': 'Részletes helyszínleírás magyarul vagy angolul.',
  'Establishing Wide': 'Totál beállítás',
  'Medium Dialogue': 'Középtotál párbeszédhez',
  'Close-up Emotion': 'Közeli érzelmi beállítás',
  'Over-Shoulder': 'Váll fölötti beállítás',
  'Insert Detail': 'Részletbeállítás',
  'Tracking Motion': 'Követő beállítás',
  'Close-up': 'Közeli',
  Wide: 'Totál',
  Fisheye: 'Halszem',
  'Handheld (Cinematic Realism)': 'Kézikamera (filmes realizmus)',
  'Dutch Angle (Tension)': 'Dőlt kamera (feszültség)',
  "Bird's-Eye (Top-Down)": 'Madártávlati (felülnézeti)',
  'Over-the-Shoulder (POV Drama)': 'Váll fölötti (POV-dráma)',
  "Worm's-Eye (Heroic Low Angle)": 'Féregszem (hősies alsó gépállás)',
  'Security Camera (Fixed Surveillance)': 'Biztonsági kamera (fix megfigyelés)',
  'Telephoto Stakeout (Long-Lens Surveillance)': 'Teleobjektíves megfigyelés',
  'CCTV Fisheye Distortion (Surveillance Archive)': 'CCTV halszemtorzítás (megfigyelési archívum)',
  'Reflection POV (Mirror/Glass Subjective)': 'Tükröződésből látott POV (tükör/üveg)',
  'Macro Forensic Detail (Extreme Close-Up)': 'Makro törvényszéki részlet (extrém közeli)',
  'Dashboard POV (In-Vehicle First-Person)': 'Műszerfal POV (belső nézet)',
  'Gritty Underground (Default)': 'Koszos underground (alapértelmezett)',
  'Black and White Film Noir': 'Fekete-fehér film noir',
  'Glitch VHS Analog Camera': 'Glitches VHS analóg kamera',
  'Neo Noir Neon': 'Neo-noir neon',
  'Dreamy Ethereal': 'Álomszerű, éteri',
  'Graphic Novel': 'Képregény',
  'Police Speeding Camera Photo': 'Rendőrségi sebességmérő kamera fotó',
  'Urban Street': 'Városi utca',
  'Apartment Interior': 'Lakásbelső',
  Office: 'Iroda',
  Warehouse: 'Raktár',
  Rooftop: 'Tető',
  'Subway Station': 'Metróállomás',
  Forest: 'Erdő',
  'Industrial Yard': 'Ipari udvar',
  'Night Highway': 'Éjszakai országút',
  'Interrogation Room': 'Kihallgatószoba',
  'Budai Family Room (Old-World Interior)': 'Budai családi szoba (régi világ hangulata)',
  'Budapest Mall Clothing Store (1999)': 'Budapesti pláza ruházati üzlete (1999)',
  'Vaulted Brick Cellar / Retro Server Room': 'Boltíves téglapince / retró szerverterem',
  'McDonalds East Europe (Late 90s / 2000)': 'McDonald’s Kelet-Európa (90-es évek vége / 2000)',
  'Old Land Rover Interior (POV)': 'Régi Land Rover belseje (POV)',
  'White Studio / Large Sofa': 'Fehér stúdió / nagy kanapé',
  'Failed to load characters': 'Nem sikerült betölteni a karaktereket.',
  'Generation failed': 'A generálás sikertelen.',
  'Loaded last settings for this character.': 'A karakter legutóbbi beállításai betöltve.',
  'Auto-saved current form.': 'Az aktuális űrlap automatikusan mentve.',
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
  if (trimmed === 'just now') {
    node.nodeValue = 'épp most';
    return;
  }
  const relative = trimmed.match(/^(\d+)([mhd]) ago$/);
  if (relative) {
    const [, amount, unit] = relative;
    const translatedUnit = unit === 'm' ? 'perce' : unit === 'h' ? 'órája' : 'napja';
    node.nodeValue = `${amount} ${translatedUnit}`;
    return;
  }
  const seconds = trimmed.match(/^(\d+) seconds$/);
  if (seconds) {
    node.nodeValue = `${seconds[1]} másodperc`;
    return;
  }
  const saved = trimmed.match(/^Saved (character|global) preset: (.+)$/);
  if (saved) {
    node.nodeValue = `${saved[1] === 'character' ? 'Karakter' : 'Globális'} preset mentve: ${saved[2]}`;
    return;
  }
  const updated = trimmed.match(/^Updated (character|global) preset\.$/);
  if (updated) {
    node.nodeValue = `${updated[1] === 'character' ? 'Karakter' : 'Globális'} preset frissítve.`;
    return;
  }
  const loaded = trimmed.match(/^Loaded (character|global) preset: (.+)$/);
  if (loaded) {
    node.nodeValue = `${loaded[1] === 'character' ? 'Karakter' : 'Globális'} preset betöltve: ${loaded[2]}`;
    return;
  }
  const loadedDefault = trimmed.match(/^Loaded global default preset: (.+)$/);
  if (loadedDefault) {
    node.nodeValue = `Globális alapértelmezett preset betöltve: ${loadedDefault[1]}`;
    return;
  }
  const deleted = trimmed.match(/^Deleted (character|global) preset\.$/);
  if (deleted) {
    node.nodeValue = `${deleted[1] === 'character' ? 'Karakter' : 'Globális'} preset törölve.`;
    return;
  }
  const statusMap: Record<string, string> = {
    queued: 'sorban',
    processing: 'feldolgozás alatt',
    done: 'kész',
    failed: 'sikertelen',
    canceled: 'megszakítva',
  };
  if (statusMap[trimmed]) node.nodeValue = statusMap[trimmed];
}

function translateAttributes(element: Element) {
  for (const name of ['aria-label', 'title', 'placeholder']) {
    const value = element.getAttribute(name);
    if (!value) continue;
    const trimmed = value.trim();
    if (TEXT_MAP[trimmed]) {
      element.setAttribute(name, TEXT_MAP[trimmed]);
      continue;
    }
    if (trimmed.startsWith('Select ')) element.setAttribute(name, `Kiválasztás: ${trimmed.slice(7)}`);
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
  if ('querySelectorAll' in root && typeof (root as ParentNode).querySelectorAll === 'function') {
    (root as ParentNode).querySelectorAll('*').forEach(translateAttributes);
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
