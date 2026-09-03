import fs from 'fs';
import path from 'path';
import { getStoragePath } from './paths';

export function ensureDir(dirPath: string) {
  const fullPath = getStoragePath(dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

export function readJSON<T = any>(filePath: string): T {
  const fullPath = getStoragePath(filePath);
  try {
    if (!fs.existsSync(fullPath)) return [] as any;
    const data = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [] as any;
  }
}

export function writeJSON(filePath: string, data: any) {
  const fullPath = getStoragePath(filePath);
  try {
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write JSON:', e);
  }
}
