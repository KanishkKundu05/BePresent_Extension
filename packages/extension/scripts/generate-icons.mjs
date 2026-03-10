import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pngPath = join(__dirname, '..', 'icon.png');
const distPath = join(__dirname, '..', 'dist');

const sizes = [16, 32, 48, 128];

mkdirSync(distPath, { recursive: true });

for (const size of sizes) {
  await sharp(pngPath)
    .resize(size, size)
    .png()
    .toFile(join(distPath, `icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}

console.log('Done!');
