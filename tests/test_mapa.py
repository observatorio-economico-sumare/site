import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "site/data/mapa-regioes-2022.json"


class TestMapaDemografico(unittest.TestCase):
    def test_ibge_source_geometry_and_totals(self):
        obj = json.loads(DATA.read_text(encoding="utf8"))
        m = obj["metadata"]
        self.assertEqual((m["municipalityCode"], m["year"]), ("3552403", 2022))
        self.assertEqual(m["field"], "v0001: total de pessoas")
        self.assertEqual(len(obj["features"]), 6)
        codes = {f["properties"]["id"] for f in obj["features"]}
        self.assertEqual(codes, {f"355240300{i}" for i in range(1, 7)})
        self.assertEqual(sum(f["properties"]["population"] for f in obj["features"]), 276846)
        self.assertEqual(m["populationInAreas"], 276846)
        self.assertEqual(m["municipalityTotal"], 279545)
        self.assertEqual(m["difference"], 2699)
        for f in obj["features"]:
            self.assertEqual(f["properties"]["year"], 2022)
            self.assertGreater(f["properties"]["population"], 0)
            self.assertIn(f["geometry"]["type"], ("Polygon", "MultiPolygon"))
            polygons = ([f["geometry"]["coordinates"]]
                        if f["geometry"]["type"] == "Polygon"
                        else f["geometry"]["coordinates"])
            self.assertTrue(polygons)
            for polygon in polygons:
                for ring in polygon:
                    self.assertGreaterEqual(len(ring), 4)
                    self.assertEqual(ring[0], ring[-1])
                    for lon, lat in ring:
                        self.assertTrue(-48 < lon < -47 and -23 < lat < -22)

    def test_files_and_translation(self):
        for page in ("index.html", "en/index.html"):
            html = (ROOT / "site" / page).read_text(encoding="utf8")
            self.assertIn('data-mapa-svg', html)
            self.assertIn('mapa.js', html)
            self.assertIn('mapa.css', html)
            self.assertLess(
                html.index('class="populacao-indicadores"'),
                html.index('class="mapa-section"'),
                "Os indicadores municipais devem anteceder o mapa"
            )
            self.assertLess(
                html.index('class="metrics metrics--two"'),
                html.index('class="mapa-section"'),
                "Os valores municipais devem ser exibidos antes do mapa"
            )
            self.assertIn('class="mapa-region-list"', html)
            self.assertIn('class="mapa-scale"', html)
            self.assertIn('class="mapa-sidebar-heading"', html)
            self.assertIn('data-mapa-selection', html)
            self.assertNotIn('class="mapa-selected"', html)
            self.assertNotIn('data-mapa-official', html)
            self.assertEqual(html.count('id="mapa-titulo"'), 1)
            self.assertIn('class="mapa-details"', html)
            self.assertIn('class="mapa-note"', html)
        self.assertLess(DATA.stat().st_size, 250000)
        js = (ROOT / "site/assets/js/mapa.js").read_text(encoding="utf8")
        self.assertNotIn("center(polygons(area.geometry)[0][0])", js)
        self.assertIn('aria-pressed', js)
        self.assertIn('ranked = [...areas].sort', js)
        css = (ROOT / "site/assets/css/mapa.css").read_text(encoding="utf8")
        self.assertNotIn(".mapa-label", css)
        self.assertIn(".mapa-scale", css)
        self.assertIn(".mapa-section { max-width: 900px; }", css)
        self.assertIn("@media (max-width: 790px)", css)
        self.assertIn("button.addEventListener(\"mouseenter\"", js)
        self.assertIn("@media (max-width: 480px)", css)


if __name__ == "__main__":
    unittest.main()
