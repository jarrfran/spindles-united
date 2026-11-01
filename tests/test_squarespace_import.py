import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('squarespace_import', Path(__file__).resolve().parents[1] / 'scripts/import-squarespace.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class EditorialHtmlTests(unittest.TestCase):
    def test_safe_content_and_layout_survive(self):
        parser = module.Body()
        parser.feed('<p style="white-space:pre-wrap;">First\nSecond <span style="text-decoration:underline">word</span></p><img src="http://images.squarespace-cdn.com/photo.jpg" alt="">')
        result = ''.join(parser.output)
        self.assertIn('white-space:pre-wrap', result)
        self.assertIn('First\nSecond', result)
        self.assertIn('text-decoration:underline', result)
        self.assertIn('src="https://images.squarespace-cdn.com/photo.jpg"', result)
        self.assertIn('alt=""', result)

    def test_export_cannot_run_script_or_submit_forms(self):
        parser = module.Body()
        parser.feed('<script>alert(1)</script><p onclick="alert(1)" style="background:url(javascript:alert(1))">Safe</p><a href="javascript:alert(1)">link</a><form action="https://example.com"><input name="secret"></form><iframe src="https://example.com/evil"></iframe>')
        result = ''.join(parser.output)
        self.assertNotIn('<script', result)
        self.assertNotIn('onclick', result)
        self.assertNotIn('javascript:', result)
        self.assertNotIn('<form', result)
        self.assertNotIn('<iframe', result)
        self.assertIn('Safe', result)

    def test_internal_links_keep_query_and_fragment(self):
        parser = module.Body()
        parser.feed('<a href="https://www.spindlesunited.com/schedule?season=2026#match-2026-08-09">Match</a>')
        self.assertIn('href="/schedule?season=2026#match-2026-08-09"', ''.join(parser.output))


if __name__ == '__main__':
    unittest.main()
