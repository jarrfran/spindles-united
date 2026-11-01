#!/usr/bin/env python3
"""Inventory and copy image assets. Sources stay immutable; no Squarespace writes."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import html
import json
from pathlib import Path
import re
import time
from urllib.parse import quote, unquote, urlsplit, urlunsplit
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CDN = 'https://images.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/'
HOSTS = {'images.squarespace-cdn.com', 'static1.squarespace.com', 'video.squarespace-cdn.com'}
MANIFEST = ROOT / 'migration/inventory/asset-mirror.json'
PUBLIC = ROOT / 'standalone/public'
URL = re.compile(r'https?://[^\s<>"\x27\\),]+')
IMAGE = re.compile(r'\.(?:jpg|jpeg|png|gif|webp|svg)$', re.I)
FRAGMENT = re.compile(r'["\x27]((?:[a-f0-9-]{36}|\d{13}-[A-Z0-9]+)/[^"\x27<>\n]+?\.(?:jpg|jpeg|png|webp))["\x27]', re.I)


def normalized(url):
    p = urlsplit(html.unescape(url))
    if p.hostname not in HOSTS or not (IMAGE.search(p.path) or p.path.endswith('/thumbnail')):
        return None
    decoded = unquote(p.path)
    if any(part in {'.', '..'} for part in decoded.split('/')) or '\x00' in decoded:
        raise ValueError('Unsafe asset path: ' + url)
    path = quote(decoded, safe='/+@-._~')
    return urlunsplit(('https', p.hostname, path, '', ''))


def collect():
    images, other = {}, {}
    private_sources = set()
    def scan(text, source):
        text = html.unescape(text).replace('\\/', '/')
        candidates = URL.findall(text) + [CDN + x for x in FRAGMENT.findall(text)]
        for candidate in candidates:
            try:
                host = urlsplit(candidate).hostname
                url = normalized(candidate)
            except ValueError:
                continue
            if url:
                p = urlsplit(url)
                entry = images.setdefault(url, {'sourceUrl': url,
                    'localUrl': '/media/squarespace/' + p.hostname + p.path.replace('+', '%2B'), 'sources': set()})
                entry['sources'].add(source)
            elif host and ('squarespace' in host) and not candidate.endswith('/'):
                other.setdefault(candidate, set()).add(source)
    files = [p for p in ROOT.iterdir() if p.suffix in {'.js', '.css', '.json'}]
    for directory, pattern in [('pages', '*.html'), ('data', '*.json'), ('content/news', '*.json'), ('standalone/app', '*.jsx')]:
        files += list((ROOT / directory).rglob(pattern))
    for p in files:
        if p.parent == ROOT / 'content/news' and json.loads(p.read_text()).get('status') != 'publish':
            private_sources.add(str(p.relative_to(ROOT)))
        scan(p.read_text(), str(p.relative_to(ROOT)))
    xml = ROOT / 'migration/source/Squarespace-Wordpress-Export-11-01-2026.xml'
    if xml.exists():
        ns = {'c': 'http://purl.org/rss/1.0/modules/content/'}
        for item in ET.parse(xml).getroot().find('channel').findall('item'):
            source = 'xml:' + (item.findtext('link') or '')
            if item.findtext('{http://wordpress.org/export/1.2/}status') == 'draft':
                private_sources.add(source)
            scan(item.findtext('c:encoded', default='', namespaces=ns), source)
    old = {e['sourceUrl']: e for e in json.loads(MANIFEST.read_text())['images']} if MANIFEST.exists() else {}
    entries = []
    for url, entry in sorted(images.items()):
        entry['sources'] = sorted(entry['sources'])
        entry['draftOnly'] = all(s in private_sources for s in entry['sources'])
        for key in ('status', 'downloadUrl', 'sha256', 'bytes', 'contentType', 'width', 'height', 'error'):
            if key in old.get(url, {}):
                entry[key] = old[url][key]
        entries.append(entry)
    return {'requestedImageWidth': 1500, 'images': entries,
            'otherSquarespaceReferences': [{'url': u, 'sources': sorted(s)} for u, s in sorted(other.items())]}


def target(entry):
    # Encoded URL characters become filesystem characters only at this boundary.
    base = ROOT / 'migration/source/draft-media' if entry.get('draftOnly') else PUBLIC
    return base / unquote(entry['localUrl'].lstrip('/'))


def copy_image(entry):
    from PIL import Image
    dest = target(entry)
    if entry.get('status') == 'copied' and dest.is_file():
        if hashlib.sha256(dest.read_bytes()).hexdigest() == entry['sha256']:
            return entry
    url = entry['sourceUrl'] + ('?format=1500w' if not entry['sourceUrl'].endswith('.svg') else '')
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'SpindlesUnited-MigrationBackup/1.0'})
            with urllib.request.urlopen(request, timeout=40) as response:
                content_type = response.headers.get_content_type()
                if not content_type.startswith('image/'):
                    raise ValueError('Expected image, received ' + content_type)
                data = response.read(25 * 1024 * 1024 + 1)
            if len(data) > 25 * 1024 * 1024:
                raise ValueError('Image exceeds 25 MiB')
            import io
            with Image.open(io.BytesIO(data)) as im:
                width, height = im.size
                im.verify()
            dest.parent.mkdir(parents=True, exist_ok=True)
            temp = dest.with_name(dest.name + '.download')
            temp.write_bytes(data)
            temp.replace(dest)
            entry.update(status='copied', downloadUrl=url, sha256=hashlib.sha256(data).hexdigest(),
                         bytes=len(data), contentType=content_type, width=width, height=height)
            entry.pop('error', None)
            return entry
        except Exception as error:
            if attempt == 2:
                entry.update(status='failed', error=str(error))
                return entry
            time.sleep(attempt + 1)


def save(manifest):
    manifest['summary'] = {'images': len(manifest['images']),
                           'copied': sum(e.get('status') == 'copied' for e in manifest['images']),
                           'failed': sum(e.get('status') == 'failed' for e in manifest['images']),
                           'bytes': sum(e.get('bytes', 0) for e in manifest['images'])}
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download', action='store_true', help='Copy image bytes; otherwise inventory only')
    args = parser.parse_args()
    manifest = collect()
    save(manifest)
    if args.download:
        with ThreadPoolExecutor(max_workers=6) as pool:
            futures = [pool.submit(copy_image, entry) for entry in manifest['images']]
            for done, future in enumerate(as_completed(futures), 1):
                future.result()
                if done % 50 == 0:
                    save(manifest)
                    print(json.dumps(manifest['summary']), flush=True)
        save(manifest)
    print(json.dumps(manifest['summary']), flush=True)
