const fs = require('fs');
const path = require('path');

const filesToPatch = [
  path.resolve(__dirname, '../node_modules/html2canvas/dist/html2canvas.js'),
  path.resolve(__dirname, '../node_modules/html2canvas/dist/html2canvas.esm.js'),
];

const targetPattern = /throw new Error\("Attempting to parse an unsupported color function \\"" \+ value\.name \+ "\\""\);/g;
const replacement = 'return 0x00000000;';

let patchedAny = false;

for (const file of filesToPatch) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (targetPattern.test(content)) {
      const patched = content.replace(targetPattern, replacement);
      fs.writeFileSync(file, patched, 'utf8');
      console.log(`[patch-html2canvas] Successfully patched: ${file}`);
      patchedAny = true;
    } else {
      console.log(`[patch-html2canvas] Already patched or pattern not found in: ${file}`);
    }
  }
}

// Remove vite cache so it rebuilds deps
const viteCacheDir = path.resolve(__dirname, '../node_modules/.vite');
if (fs.existsSync(viteCacheDir)) {
  fs.rmSync(viteCacheDir, { recursive: true, force: true });
  console.log('[patch-html2canvas] Cleared node_modules/.vite cache.');
}
