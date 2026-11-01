#!/usr/bin/env python3
"""Read only: capture current news head metadata without changing Squarespace."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


class Head(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta, self.canonical, self.title = {}, '', ''
        self.in_title = False

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'meta':
            key = attrs.get('name') or attrs.get('property')
            if key and key in {'description', 'og:title', 'og:description', 'og:image', 'og:url', 'og:type',
                               'twitter:title', 'twitter:description', 'twitter:image', 'twitter:card',
                               'article:published_time', 'article:modified_time'}:
                self.meta[key] = attrs.get('content', '')
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href', '')
        if tag == 'title':
            self.in_title = True

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def audit(post):
    url = 'https://www.spindlesunited.com' + post['path']
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'SpindlesUnited-MigrationAudit/1.0'})
        with urllib.request.urlopen(req, timeout=30) as response:
            parser = Head()
            parser.feed(response.read().decode('utf-8'))
            return {'path': post['path'], 'url': url, 'resolvedUrl': response.url, 'status': response.status,
                    'title': parser.title, 'canonical': parser.canonical, 'meta': parser.meta}
    except Exception as error:
        return {'path': post['path'], 'url': url, 'error': str(error)}


if __name__ == '__main__':
    posts = [json.loads(p.read_text()) for p in sorted((ROOT / 'content/news').glob('*.json'))]
    posts = [p for p in posts if p['status'] == 'publish']
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(audit, posts))
    out = ROOT / 'migration/inventory/live-news-metadata.json'
    out.write_text(json.dumps({'capturedAt': datetime.now(timezone.utc).isoformat(), 'articles': results},
                              ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'audited': len(results), 'ok': sum(p.get('status') == 200 for p in results),
                      'errors': [p for p in results if 'error' in p]}, indent=2))
