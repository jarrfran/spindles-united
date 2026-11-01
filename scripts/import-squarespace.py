#!/usr/bin/env python3
"""Deterministic WXR import. The original XML stays in ignored migration/source/."""
import argparse
import collections
import csv
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone
from urllib.parse import urlsplit, urlunsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = {'wp': 'http://wordpress.org/export/1.2/', 'content': 'http://purl.org/rss/1.0/modules/content/',
      'excerpt': 'http://wordpress.org/export/1.2/excerpt/', 'dc': 'http://purl.org/dc/elements/1.1/'}
ORIGIN = 'https://www.spindlesunited.com'


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def https(url):
    return re.sub(r'^http://(?=(?:images|static\d*)\.squarespace)', 'https://', url or '')


class Body(HTMLParser):
    """Allow editorial HTML, images and known video embeds; never run exported code."""
    allowed = set('p div span strong b em i h2 h3 h4 h5 h6 a br hr ul ol li blockquote img figure figcaption iframe'.split())
    void = {'br', 'hr', 'img'}
    blocked = {'script', 'style', 'object', 'embed', 'form', 'button', 'input', 'textarea', 'select'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.output, self.text, self.media, self.links, self.embeds = [], [], [], [], []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.blocked:
            if tag not in {'input', 'embed'}:
                self.skip += 1
            return
        if self.skip or tag not in self.allowed:
            return
        attrs = dict(attrs)
        kept = {}
        # These two editorial styles are the only styles present in exported news.
        styles = [s.strip() for s in attrs.get('style', '').split(';')
                  if s.strip() in {'white-space:pre-wrap', 'text-decoration:underline'}]
        if styles:
            kept['style'] = ';'.join(styles)
        if tag in {'div', 'span'}:
            kept['class'] = ' '.join(c for c in attrs.get('class', '').split()
                                    if c in {'sqs-html-content', 'image-gallery-wrapper'})
        if tag in {'a', 'img', 'iframe'}:
            key = 'href' if tag == 'a' else 'src'
            url = https(attrs.get(key, '')).strip()
            parts = urlsplit(url)
            if parts.scheme.lower() not in {'', 'https', 'http', 'mailto', 'tel'}:
                return
            if tag != 'a' and parts.scheme.lower() in {'mailto', 'tel'}:
                return
            if tag == 'iframe' and (parts.scheme not in {'https', 'http'} or parts.hostname not in {
                    'www.youtube.com', 'www.youtube-nocookie.com', 'youtube.com', 'player.vimeo.com'}):
                self.embeds.append({'url': url, 'supported': False})
                return
            if tag == 'a':
                self.links.append(url)
                # Preserve fragments/query strings while keeping internal navigation on the preview.
                if parts.hostname in {'www.spindlesunited.com', 'spindlesunited.com', 'eagle-sailfish-9jt7.squarespace.com'}:
                    url = urlunsplit(('', '', parts.path or '/', parts.query, parts.fragment))
                kept.update(href=url, rel='noopener noreferrer')
                if attrs.get('target') == '_blank':
                    kept['target'] = '_blank'
            elif tag == 'img':
                self.media.append({'url': url, 'alt': attrs.get('alt', '')})
                kept.update(src=url, alt=attrs.get('alt', ''), loading='lazy', decoding='async')
            else:
                self.embeds.append({'url': url, 'supported': True})
                kept.update(src=url, title=attrs.get('title') or 'Club video', loading='lazy',
                            allowfullscreen='', referrerpolicy='strict-origin-when-cross-origin')
        encoded = ''.join(' ' + k + '="' + html.escape(v, quote=True) + '"' for k, v in kept.items() if v or k in {'allowfullscreen', 'alt'})
        self.output.append('<' + tag + encoded + '>')

    def handle_endtag(self, tag):
        if tag in self.blocked:
            self.skip = max(0, self.skip - 1)
            return
        if not self.skip and tag in self.allowed and tag not in self.void:
            self.output.append('</' + tag + '>')
        if tag in {'p', 'h2', 'h3', 'h4', 'li', 'div'}:
            self.text.append(' ')

    def handle_data(self, text):
        if not self.skip:
            self.output.append(html.escape(text))
            self.text.append(text)


def import_export(source):
    raw = source.read_bytes()
    if b'<!DOCTYPE' in raw or b'<!ENTITY' in raw:
        raise ValueError('DTD/entity declarations are not supported')
    channel = ET.fromstring(raw).find('channel')
    if channel is None:
        raise ValueError('Missing WXR channel')
    items = channel.findall('item')
    def value(item, key):
        return item.findtext(key, default='', namespaces=NS)
    authors = {value(a, 'wp:author_login'): value(a, 'wp:author_display_name')
               for a in channel.findall('wp:author', NS)}
    feed = {p['fullUrl']: p for p in json.loads((ROOT / 'data/news-archive.json').read_text())}
    audit_file = ROOT / 'migration/inventory/live-news-metadata.json'
    audit = json.loads(audit_file.read_text()) if audit_file.exists() else {'articles': []}
    live = {p['path']: p for p in audit['articles'] if p.get('status') == 200}
    attachments = {value(i, 'wp:post_id'): {'id': value(i, 'wp:post_id'), 'title': value(i, 'title'),
                   'originalUrl': value(i, 'wp:attachment_url'), 'url': https(value(i, 'wp:attachment_url'))}
                   for i in items if value(i, 'wp:post_type') == 'attachment'}
    posts, pages, media, paths = [], [], {}, set()
    for item in items:
        kind = value(item, 'wp:post_type')
        if kind not in {'post', 'page'}:
            continue
        path = urlsplit(value(item, 'link')).path
        if not path.startswith('/') or '..' in path or path in paths:
            raise ValueError('Invalid or duplicate content path: ' + path)
        paths.add(path)
        body = value(item, 'content:encoded')
        if kind == 'page':
            core_pages = {'/home', '/about', '/history', '/schedule', '/roster', '/stats', '/sponsors', '/store'}
            pages.append({'path': path, 'title': value(item, 'title'), 'status': value(item, 'wp:status'),
                          'publishedRaw': value(item, 'pubDate'), 'bodySha256': hashlib.sha256(body.encode()).hexdigest(),
                          'standaloneStatus': ('existing repository template wrapped; parity review pending' if path in core_pages
                                               else 'preview notice; form backend pending' if path == '/contact'
                                               else 'pending route/content review')})
            continue
        slug = value(item, 'wp:post_name')
        if path != '/news/' + slug or not re.fullmatch(r'[a-zA-Z0-9_-]+', slug):
            raise ValueError('Unexpected news path/slug: ' + path)
        parsed = Body()
        parsed.feed(body)
        parsed.close()
        excerpt_raw = value(item, 'excerpt:encoded')
        excerpt = Body()
        excerpt.feed(excerpt_raw)
        description_source = 'exported excerpt' if excerpt_raw.strip() else 'generated from article text'
        text = re.sub(r'\s+', ' ', ''.join(excerpt.text if excerpt_raw.strip() else parsed.text)).strip()
        description = text if len(text) <= 180 else text[:177].rsplit(' ', 1)[0] + '…'
        observed = live.get(path, {})
        meta = observed.get('meta', {})
        if meta.get('description'):
            description, description_source = meta['description'], 'live SEO description'
        elif meta.get('og:description'):
            description, description_source = meta['og:description'], 'live social description'
        timestamp = int(parsedate_to_datetime(value(item, 'pubDate')).timestamp() * 1000)
        saved = feed.get(path, {})
        thumb = next((value(m, 'wp:meta_value') for m in item.findall('wp:postmeta', NS)
                      if value(m, 'wp:meta_key') == '_thumbnail_id'), '')
        featured = saved.get('assetUrl') or attachments.get(thumb, {}).get('url') or ''
        published = saved.get('publishOn', timestamp)
        post = {
            'id': value(item, 'wp:post_id'), 'slug': slug, 'path': path, 'title': value(item, 'title'),
            'status': value(item, 'wp:status'), 'canonical': ORIGIN + path,
            'publishedAt': datetime.fromtimestamp(published / 1000, timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z'),
            'publishOn': published, 'author': authors.get(value(item, 'dc:creator'), 'Spindles United FC'),
            'categories': [c.text for c in item.findall('category') if c.get('domain') == 'category'],
            'tags': [c.text for c in item.findall('category') if c.get('domain') in {'tag', 'post_tag'}],
            'description': description, 'descriptionSource': description_source, 'featuredImage': https(featured),
            'seo': {'title': observed.get('title') or value(item, 'title'),
                    'openGraphTitle': meta.get('og:title') or value(item, 'title'),
                    'openGraphDescription': meta.get('og:description') or description,
                    'openGraphImage': https(meta.get('og:image')) or https(featured),
                    'twitterTitle': meta.get('twitter:title') or value(item, 'title'),
                    'twitterDescription': meta.get('twitter:description') or description,
                    'twitterImage': https(meta.get('twitter:image')) or https(featured),
                    'twitterCard': meta.get('twitter:card') or 'summary_large_image'},
            'bodyHtml': ''.join(parsed.output), 'media': parsed.media, 'embeds': parsed.embeds,
            'source': {'pubDate': value(item, 'pubDate'), 'postDate': value(item, 'wp:post_date'),
                       'postDateGmt': value(item, 'wp:post_date_gmt'), 'creatorDisplayName': authors.get(value(item, 'dc:creator'), ''),
                       'commentStatus': value(item, 'wp:comment_status'), 'thumbnailId': thumb,
                       'excerptHtml': excerpt_raw, 'bodySha256': hashlib.sha256(body.encode()).hexdigest(),
                       'bodyHtml': body, 'savedFeed': saved,
                       'timestampDeltaMilliseconds': published - timestamp},
        }
        if observed:
            post['source']['liveMetadata'] = observed
        posts.append(post)
        for asset in ([{'url': post['featuredImage'], 'alt': '', 'role': 'featured'}] if featured else []) + parsed.media:
            url = asset['url']
            if url not in media:
                media[url] = {'url': url, 'articles': [], 'downloadStatus': 'not mirrored'}
            if path not in media[url]['articles']:
                media[url]['articles'].append(path)
    posts.sort(key=lambda p: (-p['publishOn'], p['path']))
    news_dir = ROOT / 'content/news'
    expected = {p['slug'] + '.json' for p in posts}
    if news_dir.exists() and {p.name for p in news_dir.glob('*.json')} - expected:
        raise ValueError('Import would remove existing article files; review manually')
    for p in posts:
        write_json(news_dir / (p['slug'] + '.json'), p)
    public = [p for p in posts if p['status'] == 'publish']
    inventory = [{k: p[k] for k in ('path', 'title', 'status', 'publishedAt', 'author', 'categories', 'tags',
                                   'canonical', 'featuredImage', 'descriptionSource')} |
                 {'imageCount': len(p['media']), 'embedCount': len(p['embeds']),
                  'sourceBodySha256': p['source']['bodySha256'],
                  'timestampDeltaMilliseconds': p['source']['timestampDeltaMilliseconds']} for p in posts]
    out = ROOT / 'migration/inventory'
    write_json(out / 'news.json', inventory)
    write_json(out / 'pages.json', pages)
    write_json(out / 'media.json', list(media.values()))
    write_json(out / 'attachments.json', list(attachments.values()))
    with (out / 'news.csv').open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=inventory[0].keys(), lineterminator='\n')
        writer.writeheader()
        writer.writerows({k: '; '.join(v) if isinstance(v, list) else v for k, v in row.items()} for row in inventory)
    report = {'sourceFile': source.name, 'sourceSha256': hashlib.sha256(raw).hexdigest(), 'totalItems': len(items),
              'publishedArticles': len(public), 'draftArticles': len(posts) - len(public), 'pages': len(pages),
              'attachments': len(attachments), 'uniqueArticleMediaUrls': len(media),
              'categories': dict(collections.Counter(c for p in public for c in p['categories'])),
              'publishedYears': dict(sorted(collections.Counter(p['publishedAt'][:4] for p in public).items())),
              'missingFromSavedFeed': sorted(p['path'] for p in public if p['path'] not in feed),
              'savedFeedNotInPublishedExport': sorted(set(feed) - {p['path'] for p in public}),
              'dateDifferencesOverOneSecond': [p['path'] for p in posts if abs(p['source']['timestampDeltaMilliseconds']) > 1000],
              'missingFeaturedImages': [p['path'] for p in public if not p['featuredImage']],
              'emptyBodies': [p['path'] for p in public if not p['source']['bodyHtml'].strip()],
              'unsupportedEmbeds': [dict(article=p['path'], **e) for p in posts for e in p['embeds'] if not e['supported']],
              'exportedExcerpts': sum(bool(p['source']['excerptHtml']) for p in posts),
              'liveAuditedArticles': len(live),
              'liveSeoDescriptions': sum(bool(p.get('meta', {}).get('description')) for p in live.values()),
              'liveSocialDescriptions': sum(bool(p.get('meta', {}).get('og:description')) for p in live.values()),
              'canonicalDiscrepancies': [p['path'] for p in posts if p['path'] in live and live[p['path']]['canonical'] != p['canonical']],
              'modifiedDatesExported': False, 'launchReady': False}
    write_json(out / 'report.json', report)
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('export', type=Path)
    import_export(parser.parse_args().export)
