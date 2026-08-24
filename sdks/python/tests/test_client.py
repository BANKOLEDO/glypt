from glypt import Glypt
from glypt.client import DEFAULT_BASE_URL


class FakeResponse:
    def __init__(self, status=200, json_data=None, text="", content=b""):
        self.status_code = status
        self._json = json_data
        self.text = text
        self.content = content
        self.ok = status < 400

    def json(self):
        if self._json is None:
            raise ValueError("no json")
        return self._json


def test_search_shapes_request(monkeypatch):
    calls = {}

    def fake_request(self, method, url, timeout=None, **kwargs):
        calls["url"] = url
        calls["params"] = kwargs.get("params")
        return FakeResponse(json_data={"icons": ["lucide:rocket"]})

    monkeypatch.setattr("requests.Session.request", fake_request)
    g = Glypt(DEFAULT_BASE_URL, api_key="gl_live_test")
    assert g.search("rocket", limit=7) == ["lucide:rocket"]
    assert calls["url"].endswith("/api/search")
    assert calls["params"] == {"q": "rocket", "limit": 7}


def test_api_key_header(monkeypatch):
    seen = {}

    class FakeSession:
        headers = {}

        def request(self, method, url, timeout=None, **kwargs):
            seen["headers"] = self.headers
            return FakeResponse(json_data={"icons": []})

    g = Glypt("http://x", api_key="gl_live_abc", session=FakeSession())
    g.search("x")
    assert seen["headers"]["x-api-key"] == "gl_live_abc"


def test_quota_maps_to_dedicated_error(monkeypatch):
    def fake_request(self, method, url, timeout=None, **kwargs):
        return FakeResponse(status=429, json_data={"error": "daily search quota reached"})

    monkeypatch.setattr("requests.Session.request", fake_request)
    from glypt.errors import QuotaExceeded

    g = Glypt(DEFAULT_BASE_URL)
    try:
        g.search("x")
        raised = False
    except QuotaExceeded:
        raised = True
    assert raised


def test_export_returns_bytes(monkeypatch):
    def fake_request(self, method, url, timeout=None, **kwargs):
        assert kwargs["json"] == {"icons": ["ph:star"], "formats": ["svg"]}
        return FakeResponse(content=b"PK\x03\x04zip")

    monkeypatch.setattr("requests.Session.request", fake_request)
    g = Glypt(DEFAULT_BASE_URL)
    assert g.export_zip(["ph:star"], ["svg"]).startswith(b"PK")
