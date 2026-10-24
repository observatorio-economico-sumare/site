"""Verifica URLs oficiais, idiomas e descoberta de páginas do OES."""
import unittest
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

SITE = Path(__file__).resolve().parents[1] / "site"
BASE = "https://oesumare.github.io"
PAGES = ("index.html", "governanca.html", "biblioteca.html",
         "en/index.html", "en/governanca.html")


class Metadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = None
        self.og_url = None
        self.alternates = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical = attrs.get("href")
        if tag == "link" and attrs.get("rel") == "alternate":
            self.alternates[attrs.get("hreflang")] = attrs.get("href")
        if tag == "meta" and attrs.get("property") == "og:url":
            self.og_url = attrs.get("content")


class SeoTests(unittest.TestCase):
    def test_canonical_and_sharing_urls(self):
        for page in PAGES:
            with self.subTest(page=page):
                doc = Metadata()
                doc.feed((SITE / page).read_text(encoding="utf-8"))
                expected = BASE + ("/" if page == "index.html" else "/" + page)
                self.assertEqual(doc.canonical, expected)
                self.assertEqual(doc.og_url, expected)
                if page != "biblioteca.html":
                    stem = "governanca.html" if "governanca" in page else "index.html"
                    pt_url = BASE + ("/" if stem == "index.html" else "/" + stem)
                    self.assertEqual(doc.alternates, {
                        "pt-BR": pt_url, "en": BASE + "/en/" + stem})

    def test_sitemap_and_robots(self):
        xml = ET.parse(SITE / "sitemap.xml").getroot()
        ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        urls = {node.text for node in xml.findall("s:url/s:loc", ns)}
        expected = {BASE + ("/" if p == "index.html" else "/" + p)
                    for p in PAGES}
        self.assertEqual(urls, expected)
        robots = (SITE / "robots.txt").read_text(encoding="utf-8")
        self.assertIn("Sitemap: " + BASE + "/sitemap.xml", robots)


if __name__ == "__main__":
    unittest.main()
