#!/usr/bin/env python3
"""Prepare legacy page content and explicit route decisions without native forms."""
from html.parser import HTMLParser
import hashlib
import html
import importlib.util
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('news_import', ROOT / 'scripts/import-squarespace.py')
news = importlib.util.module_from_spec(spec)
spec.loader.exec_module(news)
VOID = {'img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'area', 'wbr', 'embed'}


class Tree(HTMLParser):
    def __init__(self):
        super().__init__()
        self.root = {'tag': 'root', 'attrs': {}, 'children': []}
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = {'tag': tag, 'attrs': dict(attrs), 'children': []}
        self.stack[-1]['children'].append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index]['tag'] == tag:
                self.stack = self.stack[:index]
                break

    def handle_data(self, value):
        self.stack[-1]['children'].append(value)


def walk(node):
    yield node
    for child in node['children']:
        if isinstance(child, dict):
            yield from walk(child)


def text(node):
    if isinstance(node, str):
        return node
    if node['tag'] in {'script', 'style'}:
        return ''
    return ' '.join(text(c) for c in node['children'])


def markup(node):
    if isinstance(node, str):
        return html.escape(node)
    tag = 'h2' if node['tag'] == 'h1' else node['tag']
    attrs = ''.join(' ' + k + '="' + html.escape(v or '', quote=True) + '"' for k, v in node['attrs'].items())
    return '<' + tag + attrs + '>' + ''.join(markup(c) for c in node['children']) + ('' if tag in VOID else '</' + tag + '>')


def image_url(node):
    return node['attrs'].get('data-src') or node['attrs'].get('src') or ''


def editorial(root, title):
    blocks, seen_images = [], set()
    def visit(node, parent_link=''):
        attrs = node['attrs']
        parent_link = attrs.get('href', parent_link) if node['tag'] == 'a' else parent_link
        classes = attrs.get('class', '').split()
        if node['tag'] in {'script', 'style', 'form', 'noscript'}:
            return
        if 'sqs-html-content' in classes:
            value = ' '.join(text(node).split())
            if value and value.casefold().rstrip('.') != title.casefold().rstrip('.'):
                blocks.append(markup(node))
            return
        if node['tag'] == 'img':
            url = image_url(node)
            if url.startswith(('https://', 'http://')) and url not in seen_images:
                seen_images.add(url)
                image = '<img src="' + html.escape(url, quote=True) + '" alt="' + html.escape(attrs.get('alt', ''), quote=True) + '">'
                if parent_link:
                    image = '<a href="' + html.escape(parent_link, quote=True) + '">' + image + '</a>'
                blocks.append('<figure>' + image + '</figure>')
            return
        if node['tag'] == 'iframe':
            blocks.append(markup(node))
            return
        if 'sqs-block-button' in classes:
            for link in walk(node):
                if link['tag'] == 'a' and link['attrs'].get('href'):
                    blocks.append('<p>' + markup(link) + '</p>')
            return
        for child in node['children']:
            if isinstance(child, dict):
                visit(child, parent_link)
    visit(root)
    parsed = news.Body()
    parsed.feed(''.join(blocks))
    return ''.join(parsed.output), parsed.media, parsed.embeds


def import_pages(source):
    ns = news.NS
    raw_xml = source.read_bytes()
    if b'<!DOCTYPE' in raw_xml or b'<!ENTITY' in raw_xml:
        raise ValueError('DTD/entity declarations are not supported')
    channel = ET.fromstring(raw_xml).find('channel')
    redirects = {'/inside-spindles': '/about', '/seasons-1': '/history', '/seasons': '/history',
                 '/home-2': '/', '/2025-schedule-1': '/schedule?season=2025',
                 '/2026-sponsors': '/sponsors', '/2026-player-interest': '/contact?reason=player',
                 '/privacy': '/privacy-policy', '/winter-tryout-sign-up': '/contact?reason=player',
                 '/post/introducing-the-white-kit': '/news/the-white-kit-2024'}
    for year in range(2022, 2027):
        for page in ['schedule', 'roster']:
            redirects['/' + str(year) + '-' + page] = '/' + page + '?season=' + str(year)
    core = {'/home', '/contact', '/stats', '/schedule', '/roster', '/about', '/history', '/sponsors', '/store'}
    decisions, pages = [], []
    for item in channel.findall('item'):
        if item.findtext('wp:post_type', namespaces=ns) != 'page':
            continue
        path, title = item.findtext('link'), item.findtext('title')
        if not re.fullmatch(r'/[a-z0-9-]+', path):
            raise ValueError('Unexpected page path')
        raw = item.findtext('content:encoded', default='', namespaces=ns)
        if path in redirects:
            decisions.append({'path': path, 'type': 'redirect', 'destination': redirects[path], 'statusCode': 308})
            continue
        if path in core:
            decisions.append({'path': path, 'type': 'core', 'destination': '/' if path == '/home' else path})
            continue
        tree = Tree()
        tree.feed(raw)
        body, media, embeds = editorial(tree.root, title)
        historical = path in {'/2024-sponsors', '/2025-sponsors', '/2025-player-interest', '/soccertots',
                              '/grassroots', '/2025-winter-showcase', '/2025-fall-showcase'}
        reason = 'sponsor' if 'sponsors' in path else 'player' if 'player-interest' in path else 'volunteer' if path == '/volunteer' else 'other'
        description = ' '.join(text(tree.root).split())
        record = {'path': path, 'title': title, 'canonical': news.ORIGIN + path,
                  'description': (description[:177].rsplit(' ', 1)[0] + '…') if len(description) > 180 else description,
                  'bodyHtml': body, 'media': media, 'embeds': embeds, 'historical': historical,
                  'contactReason': reason, 'emptySource': not bool(description),
                  'sourceBodySha256': hashlib.sha256(raw.encode()).hexdigest()}
        news.write_json(ROOT / 'content/pages' / (path[1:] + '.json'), record)
        pages.append(record)
        decisions.append({'path': path, 'type': 'page', 'historical': historical,
                          'status': 'needs policy content review' if path == '/privacy-policy' else 'editorial archive prepared'})
    extra = [{'path': p, 'type': 'redirect', 'destination': d, 'statusCode': 308} for p, d in redirects.items()
             if p not in {r['path'] for r in decisions}]
    news.write_json(ROOT / 'migration/inventory/page-routes.json', {'routes': sorted(decisions + extra, key=lambda p: p['path']),
        'summary': {'exportedPages': len(decisions), 'editorialPages': len(pages), 'separateNativeFormsMigrated': 0,
                    'contactPage': '/contact', 'emptySourcePages': [p['path'] for p in pages if p['emptySource']]}})
    inventory = ROOT / 'migration/inventory/pages.json'
    if inventory.exists():
        lookup = {r['path']: r for r in decisions}
        previous = json.loads(inventory.read_text())
        for page in previous:
            route = lookup[page['path']]
            page['standaloneStatus'] = ('unified contact form prepared; delivery setup pending' if page['path'] == '/contact'
                else '308 redirect to ' + route['destination'] if route['type'] == 'redirect'
                else route.get('status', 'existing repository template wrapped; parity review pending'))
        news.write_json(inventory, previous)
    print(json.dumps({'exportedPages': len(decisions), 'editorialPages': len(pages), 'redirects': len(redirects)}))


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('export', type=Path)
    import_pages(parser.parse_args().export)
