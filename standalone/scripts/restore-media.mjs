import { readFile, writeFile, appendFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const run = promisify(execFile);
const root = fileURLToPath(new URL('../../', import.meta.url));
const hash = data => createHash('sha256').update(data).digest('hex');
export async function restoreMedia() {
  const bundle = JSON.parse(await readFile(path.join(root, 'migration/inventory/media-bundle.json'), 'utf8'));
  const stamp = path.join(root, 'standalone/generated/media-restored.sha256');
  let previous;
  try { previous = await readFile(stamp, 'utf8'); } catch {}
  if (previous === bundle.archiveSha256) {
    const results = await Promise.allSettled(bundle.filePaths.map(f => access(path.join(root, 'standalone/public', f))));
    if (results.every(r => r.status === 'fulfilled')) return;
  }
  await mkdir(path.join(root, 'standalone/generated'), { recursive: true });
  const archivePath = path.join(root, 'standalone/generated/media.tar.gz');
  await writeFile(archivePath, Buffer.alloc(0));
  const archiveHash = createHash('sha256');
  for (const part of bundle.parts) {
    const data = await readFile(path.join(root, part.path));
    if (data.length !== part.bytes || hash(data) !== part.sha256) throw new Error('Media bundle part failed verification: ' + part.path);
    archiveHash.update(data);
    await appendFile(archivePath, data);
  }
  if (archiveHash.digest('hex') !== bundle.archiveSha256) throw new Error('Media archive checksum mismatch');
  const { stdout } = await run('tar', ['-tzf', archivePath], { maxBuffer: 2 * 1024 * 1024 });
  const paths = stdout.trim().split('\n');
  if (JSON.stringify(paths) !== JSON.stringify(bundle.filePaths)) throw new Error('Media archive paths differ from inventory');
  if (paths.some(p => !p.startsWith('media/squarespace/') || p.split('/').some(x => x === '..' || x === '.'))) throw new Error('Unsafe media archive path');
  await mkdir(path.join(root, 'standalone/public'), { recursive: true });
  await run('tar', ['-xzf', archivePath, '-C', path.join(root, 'standalone/public')]);
  await writeFile(stamp, bundle.archiveSha256);
  console.log('Restored ' + bundle.files + ' verified media files from the repository bundle.');
}
