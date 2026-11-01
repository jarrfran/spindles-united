import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('pages', Path(__file__).resolve().parents[1] / 'scripts/import-squarespace-pages.py')
pages = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pages)


class PageImportTests(unittest.TestCase):
    def render(self, source):
        parser = pages.Tree()
        parser.feed(source)
        return pages.editorial(parser.root, 'Club page')

    def test_editorial_prose_and_sponsor_image_links_survive(self):
        body, media, _ = self.render('<div class="sqs-html-content"><h1>Our partners</h1><p>Original <strong>words</strong>.</p></div><a href="https://partner.example"><img data-src="https://images.example/logo.png" alt="Partner"></a>')
        self.assertIn('<h2>Our partners</h2>', body)
        self.assertIn('Original <strong>words</strong>.', body)
        self.assertIn('href="https://partner.example"', body)
        self.assertEqual(media[0]['alt'], 'Partner')

    def test_native_forms_and_exported_code_cannot_execute(self):
        body, _, _ = self.render('<form><input><div class="sqs-html-content">Old signup</div></form><script>alert(1)</script><div class="sqs-html-content"><p onclick="evil()">Safe text</p></div>')
        self.assertNotIn('Old signup', body)
        self.assertNotIn('script', body)
        self.assertNotIn('onclick', body)
        self.assertIn('Safe text', body)

    def test_duplicate_image_reference_does_not_duplicate_gallery(self):
        body, media, _ = self.render('<img src="https://images.example/a.jpg"><img src="https://images.example/a.jpg">')
        self.assertEqual(len(media), 1)
        self.assertEqual(body.count('<img'), 1)
