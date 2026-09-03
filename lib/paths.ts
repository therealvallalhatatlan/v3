import path from 'path';
import fs from 'fs';

const BASE_STORAGE = process.env.STORAGE_DIR || 'E:/ai-storage';

export function getStoragePath(...segments: string[]): string {
  return path.join(BASE_STORAGE, ...segments);
}

export function initStorage() {
  const dirs = [
    getStoragePath(),
    getStoragePath('images'),
    getStoragePath('generated'),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {
        console.error('Failed to create storage directory:', dir, e);
      }
    }
  }
  // Check if base storage exists and is writable
  try {
    fs.accessSync(getStoragePath(), fs.constants.W_OK);
  } catch (e) {
    console.error('Storage directory is not writable or missing:', getStoragePath(), e);
  }
}
