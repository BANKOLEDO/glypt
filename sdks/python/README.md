# Glypt Python SDK

Official sync client for the Glypt API.

```bash
pip install glypt
```

```python
from glypt import Glypt

g = Glypt("http://localhost:4000", api_key="gl_live_...")

# search 200k+ icons
hits = g.search("rocket", limit=12)

# grab raw svg markup
svg = g.icon_svg(hits[0])

# visual selection grid (A1..H8)
atlas = g.build_atlas(hits[:16], cols=4)
picked = g.resolve_atlas(["A1", "B2"])

# brand kit from any domain
brand = g.extract_brand("stripe.com")

# bundle icons + snippets as a zip
zip_bytes = g.export_zip(hits[:8], ["react", "svg"])
```

Errors: `GlyptError` base; `ApiError(status, message)`; `QuotaExceeded` on HTTP 429.

Run tests:

```bash
cd sdks/python && pip install -e .[dev] && pytest -q
```
