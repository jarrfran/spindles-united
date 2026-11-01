#!/usr/bin/env python3
"""Copy the two public HLS streams, preserving renditions, audio and local playlists."""
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit, urlunsplit
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'standalone/public'
OUTPUT = ROOT / 'migration/inventory/video-mirror.json'
HOST = 'video.squarespace-cdn.com'
old = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {'assets': []}
previous = {p['sourceUrl']: p for p in old['assets']}
entries = {}


def stable(url):
    p = urlsplit(url)
    if p.hostname != HOST or any(x in {'.', '..'} for x in unquote(p.path).split('/')):
        raise ValueError('Unexpected video dependency host or path')
    return urlunsplit(('https', HOST, p.path, '', ''))


def local(url):
    p = urlsplit(stable(url))
    return '/media/squarespace/' + HOST + p.path


def download(url):
    source = stable(url)
    if source in entries:
        return entries[source]['localUrl']
    dest = PUBLIC / unquote(local(url).lstrip('/'))
    prior = previous.get(source)
    playlist = urlsplit(url).path.endswith('.m3u8')
    if not playlist and prior and dest.exists() and hashlib.sha256(dest.read_bytes()).hexdigest() == prior['sha256']:
        entries[source] = prior
        return local(url)
    request = urllib.request.Request(url, headers={'User-Agent': 'SpindlesUnited-MigrationBackup/1.0'})
    with urllib.request.urlopen(request, timeout=45) as response:
        data = response.read(50 * 1024 * 1024 + 1)
        content_type = response.headers.get_content_type()
    if len(data) > 50 * 1024 * 1024 or content_type == 'text/html':
        raise ValueError('Invalid or oversized video asset')
    if len(entries) > 500 or sum(e['bytes'] for e in entries.values()) + len(data) > 200 * 1024 * 1024:
        raise ValueError('Video backup exceeds review limits')
    if playlist:
        text = data.decode()
        if not text.startswith('#EXTM3U'):
            raise ValueError('Unsupported video playlist')
        # Preserve standard public HLS encryption and its delivered media key;
        # do not decrypt, transcode or handle DRM/license-based formats.
        for key in re.findall(r'^#EXT-X-KEY:(.*)$', text, re.M):
            if not key.startswith(('METHOD=AES-128,', 'METHOD=NONE')):
                raise ValueError('Unsupported video encryption format')
        # Reserve the path to prevent a malformed playlist cycle.
        entries[source] = {'sourceUrl': source, 'localUrl': local(url), 'bytes': 0}
        lines = []
        for line in text.splitlines():
            if line and not line.startswith('#'):
                line = download(urljoin(url, line))
            elif 'URI="' in line:
                line = re.sub(r'URI="([^"]+)"', lambda match: 'URI="' + download(urljoin(url, match[1])) + '"', line)
            lines.append(line)
        data = ('\n'.join(lines) + '\n').encode()
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    entries[source] = {'sourceUrl': source, 'localUrl': local(url), 'bytes': len(data),
                       'sha256': hashlib.sha256(data).hexdigest(), 'contentType': content_type}
    return local(url)


if __name__ == '__main__':
    manifest = json.loads((ROOT / 'migration/inventory/asset-mirror.json').read_text())
    streams = [e['url'] for e in manifest['otherSquarespaceReferences'] if e['url'].endswith('/playlist.m3u8')]
    for stream in streams:
        download(stream)
        print('Copied stream ' + urlsplit(stream).path.split('/')[-2], flush=True)
    result = {'streams': streams, 'assets': [e for _, e in sorted(entries.items())],
              'summary': {'streams': len(streams), 'files': len(entries), 'bytes': sum(e['bytes'] for e in entries.values())}}
    OUTPUT.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result['summary']), flush=True)
