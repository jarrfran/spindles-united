#!/usr/bin/env python3
"""Create a deterministic, offline media bundle for clean-checkout Vercel builds."""
import gzip
import hashlib
import io
import json
from pathlib import Path
import tarfile
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'standalone/public'
OUTPUT = ROOT / 'media/squarespace'
CHUNK = 6 * 1024 * 1024


if __name__ == '__main__':
    images = json.loads((ROOT / 'migration/inventory/asset-mirror.json').read_text())
    videos = json.loads((ROOT / 'migration/inventory/video-mirror.json').read_text())
    entries = [p for p in images['images'] if not p['draftOnly']] + videos['assets']
    entries = sorted(entries, key=lambda p: p['localUrl'])
    temp = ROOT / 'migration/source/media-bundle.tar.gz'
    temp.parent.mkdir(parents=True, exist_ok=True)
    with temp.open('wb') as raw:
        with gzip.GzipFile(fileobj=raw, mode='wb', mtime=0, filename='') as compressed:
            with tarfile.open(fileobj=compressed, mode='w|') as archive:
                for entry in entries:
                    relative = unquote(entry['localUrl'].lstrip('/'))
                    if not relative.startswith('media/squarespace/') or '..' in Path(relative).parts:
                        raise ValueError('Unsafe bundle path')
                    data = (PUBLIC / relative).read_bytes()
                    if hashlib.sha256(data).hexdigest() != entry['sha256']:
                        raise ValueError('Asset checksum mismatch: ' + relative)
                    info = tarfile.TarInfo(relative)
                    info.size = len(data)
                    info.mode = 0o644
                    info.mtime = 0
                    archive.addfile(info, io.BytesIO(data))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    parts = []
    with temp.open('rb') as source:
        while data := source.read(CHUNK):
            name = f'assets.tar.gz.part-{len(parts):03d}'
            (OUTPUT / name).write_bytes(data)
            parts.append({'path': 'media/squarespace/' + name, 'bytes': len(data),
                          'sha256': hashlib.sha256(data).hexdigest()})
    expected = {p['path'].split('/')[-1] for p in parts}
    for stale in OUTPUT.glob('assets.tar.gz.part-*'):
        if stale.name not in expected:
            stale.unlink()
    manifest = {'format': 'split-tar-gzip', 'files': len(entries), 'parts': parts,
                'unpackedBytes': sum(p['bytes'] for p in entries), 'archiveBytes': temp.stat().st_size,
                'archiveSha256': hashlib.sha256(temp.read_bytes()).hexdigest(),
                'filePaths': [unquote(p['localUrl'].lstrip('/')) for p in entries]}
    (ROOT / 'migration/inventory/media-bundle.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in manifest.items() if k not in {'parts', 'filePaths'}}))
