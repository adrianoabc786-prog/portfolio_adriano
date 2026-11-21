import os, sys, tempfile, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import create_app, validate_url


class LinkShortTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False); self.tmp.close()
        self.c = create_app(self.tmp.name).test_client()

    def tearDown(self):
        os.unlink(self.tmp.name)

    def make(self, **kw):
        return self.c.post("/api/links", json=kw)

    def test_validate_url(self):
        self.assertEqual(validate_url("")[1], "Informe uma URL.")
        for bad in ["javascript:alert(1)", "ftp://x.com", "http://", "https://nodot", "https://a b.com"]:
            self.assertIsNotNone(validate_url(bad)[1], bad)
        self.assertEqual(validate_url("exemplo.com")[0], "https://exemplo.com")

    def test_create_and_redirect(self):
        r = self.make(url="https://example.com/a?b=1"); self.assertEqual(r.status_code, 201)
        code = r.get_json()["code"]; self.assertEqual(len(code), 6)
        g = self.c.get("/" + code); self.assertEqual(g.status_code, 302)
        self.assertEqual(g.headers["Location"], "https://example.com/a?b=1")

    def test_custom_code_and_duplicates(self):
        self.assertEqual(self.make(url="https://a.com", code="meu-link").status_code, 201)
        self.assertEqual(self.make(url="https://b.com", code="meu-link").status_code, 409)
        self.assertEqual(self.make(url="https://b.com", code="a b").status_code, 400)
        self.assertEqual(self.make(url="https://b.com", code="api").status_code, 400)

    def test_invalid_and_empty(self):
        self.assertEqual(self.make(url="").status_code, 400)
        self.assertEqual(self.make(url="javascript:alert(1)").status_code, 400)
        self.assertEqual(self.c.post("/api/links", data="x").status_code, 400)

    def test_stats_search_delete(self):
        a = self.make(url="https://alpha.com", code="alpha").get_json(); self.make(url="https://beta.com", code="beta")
        self.c.get("/alpha"); self.c.get("/alpha")
        s = self.c.get("/api/stats").get_json()
        self.assertEqual((s["total_links"], s["total_visits"], s["top"][0]["code"]), (2, 2, "alpha"))
        self.assertEqual(len(self.c.get("/api/links?q=beta").get_json()), 1)
        self.assertEqual(len(self.c.get("/api/links?q=%25%27%3B--").get_json()), 0)  # entrada maliciosa não quebra a consulta
        self.assertEqual(self.c.delete(f"/api/links/{a['id']}").status_code, 204)
        self.assertEqual(self.c.delete(f"/api/links/{a['id']}").status_code, 404)
        self.assertEqual(self.c.get("/alpha").status_code, 404)

    def test_persistence(self):
        self.make(url="https://p.com", code="persist")
        again = create_app(self.tmp.name).test_client()
        self.assertEqual(again.get("/persist").status_code, 302)


if __name__ == "__main__":
    unittest.main()
