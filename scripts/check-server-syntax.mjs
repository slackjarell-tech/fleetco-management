import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const serverDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'server');
const files = fs.readdirSync(serverDir).filter((name) => name.endsWith('.js'));

for (const file of files) {
  const fullPath = path.join(serverDir, file);
  execSync(`node --check "${fullPath}"`, { stdio: 'inherit' });
}

console.log(`Server syntax OK (${files.length} files)`);
