import path from 'path';
import { fileURLToPath } from 'url';
import { cp, mkdir, rm, stat } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');
const outputRoot = path.join(repoRoot, 'dist', 'public');

const foldersToCopy = [
  'shared',
  'craps',
  'poker',
  'roulette',
  'wordchange',
  'solitaire',
  'slots',
  'blackjack',
  'holdem',
];

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(outputRoot, { recursive: true });

  for (const folderName of foldersToCopy) {
    const source = path.join(repoRoot, folderName);
    const destination = path.join(outputRoot, folderName);

    if (!(await pathExists(source))) {
      throw new Error(`Missing folder: ${source}`);
    }

    await rm(destination, { recursive: true, force: true });
    await cp(source, destination, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
