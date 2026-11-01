#!/usr/bin/env python3
"""Offline audit of generated editorial links against prepared standalone routes."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote, urljoin
import collections
import json

ROOT = Path(__file__).resolve().parents[1]


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag == 'a' and dict(attrs).get('href'):
            self.links.append(dict(attrs)['href'])


def audit():
    routes = json.loads((ROOT / 'migration/inventory/page-routes.json').read_text())['routes']
    known = {r['path'] for r in routes} | {'/', '/news', '/news/rss.xml', '/sitemap.xml', '/robots.txt'}
    posts = json.loads((ROOT / 'standalone/generated/posts.json').read_text())
    pages = json.loads((ROOT / 'standalone/generated/pages.json').read_text())
    legacy = json.loads((ROOT / 'standalone/generated/legacy.json').read_text())
    known.update(p['path'] for p in posts)
    sources = [(p['path'], p['bodyHtml']) for p in posts + pages]
    sources += [('/' + name, body) for name, body in legacy['pages'].items()]
    sources += [('/', legacy['footer'])]
    missing, all_links = collections.defaultdict(set), set()
    for source, body in sources:
        parser = Links()
        parser.feed(body)
        for href in parser.links:
            url = urlsplit(urljoin('https://www.spindlesunited.com' + source, href))
            if url.hostname not in {'www.spindlesunited.com', 'spindlesunited.com', 'eagle-sailfish-9jt7.squarespace.com'}:
                continue
            path = unquote(url.path).rstrip('/') or '/'
            all_links.add(path)
            if path in known or path.startswith('/news/category/') or (ROOT / 'standalone/public' / path.lstrip('/')).is_file():
                continue
            missing[path].add(source)
    report = {'scope': 'Generated published article bodies, editorial pages, current core templates and footer; offline route resolution, not a full browser crawl',
              'distinctInternalPaths': len(all_links),
              'unresolved': [{'path': path, 'sources': sorted(sources)} for path, sources in sorted(missing.items())]}
    (ROOT / 'migration/inventory/internal-links.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))


if __name__ == '__main__':
    audit()
