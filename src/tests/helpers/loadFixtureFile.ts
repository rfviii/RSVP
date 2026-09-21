import { readFileSync } from 'node:fs';
import path from 'node:path';

export function loadFixtureFile(fileName: string, mimeType: string): File {
  const fixturePath = path.resolve(process.cwd(), 'src/tests/fixtures', fileName);
  const buffer = readFileSync(fixturePath);
  return new File([buffer], fileName, { type: mimeType });
}
