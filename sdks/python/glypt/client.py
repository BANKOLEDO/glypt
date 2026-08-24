"""Sync client for the Glypt API.

    from glypt import Glypt
    g = Glypt("http://localhost:4000", api_key="gl_live_...")
    hits = g.search("rocket", limit=12)
    svg = g.icon_svg("lucide:rocket")
"""

from __future__ import annotations

from typing import Any

import requests

from .errors import ApiError, QuotaExceeded

DEFAULT_BASE_URL = "http://localhost:4000"
DEFAULT_TIMEOUT = 15.0


class Glypt:
    """Small, typed, dependency-light wrapper around the Glypt REST API."""

    def __init__(
        self,
        base_url: str = DEFAULT_BASE_URL,
        *,
        api_key: str | None = None,
        session: requests.Session | None = None,
        timeout: float = DEFAULT_TIMEOUT,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._session = session or requests.Session()
        if api_key:
            self._session.headers["x-api-key"] = api_key

    def _request(self, method: str, path: str, **kwargs: Any) -> requests.Response:
        url = f"{self.base_url}{path}"
        try:
            res = self._session.request(method, url, timeout=self.timeout, **kwargs)
        except requests.RequestException as exc:
            raise ApiError(0, f"connection failed: {exc}") from exc
        if res.status_code == 429:
            raise QuotaExceeded()
        if not res.ok:
            try:
                message = res.json().get("error", res.text)
            except ValueError:
                message = res.text
            raise ApiError(res.status_code, message)
        return res

    # icons ---------------------------------------------------------------

    def search(self, query: str, *, limit: int = 24) -> list[str]:
        """Search 200k+ iconify-backed icons; returns ids like 'lucide:rocket'."""
        data = self._request(
            "GET",
            "/api/search",
            params={"q": query, "limit": limit},
        ).json()
        return list(data.get("icons", []))

    def icon_svg(self, icon_id: str) -> str:
        """Fetch the raw SVG markup for one icon id."""
        prefix, name = icon_id.split(":", 1)
        return self._request(
            "GET",
            "/api/icon",
            params={"prefix": prefix, "name": name},
        ).text

    # atlas -----------------------------------------------------------------

    def build_atlas(self, icons: list[str], *, cols: int | None = None) -> dict:
        """Place up to 32 icons on an A1..H8 grid for visual selection."""
        payload: dict[str, Any] = {"icons": icons}
        if cols is not None:
            payload["cols"] = cols
        return self._request("POST", "/api/atlas", json=payload).json()

    def resolve_atlas(self, refs: list[str]) -> dict:
        """Map chosen refs (e.g. ['A1','B3']) back to icon ids."""
        return self._request("POST", "/api/atlas/resolve", json={"refs": refs}).json()

    # brand -----------------------------------------------------------------

    def extract_brand(self, domain: str) -> dict:
        """Extract a palette + logo candidates from any public site."""
        return self._request("GET", "/api/brand", params={"domain": domain}).json()

    # generation --------------------------------------------------------------

    def generate_social(self, brand: dict, *, text: str) -> bytes:
        """Render a branded social card; returns PNG bytes."""
        return self._generate({"kind": "social", "brand": brand, "text": text})

    def generate_deck(self, brand: dict, *, title: str) -> bytes:
        """Render a branded deck cover; returns PNG bytes."""
        return self._generate({"kind": "deck", "brand": brand, "title": title})

    def generate_mockup(self, *, image_url: str, frame: str = "browser") -> bytes:
        """Wrap a screenshot in a device frame; returns PNG bytes."""
        return self._generate({"kind": "mockup", "imageUrl": image_url, "frame": frame})

    def _generate(self, body: dict) -> bytes:
        return self._request("POST", "/api/generate", json=body).content

    # export -------------------------------------------------------------------

    def export_zip(self, icons: list[str], formats: list[str] | None = None) -> bytes:
        """Bundle icons (+ code snippets) into a downloadable ZIP."""
        payload: dict[str, Any] = {"icons": icons}
        if formats:
            payload["formats"] = formats
        return self._request("POST", "/api/export", json=payload).content
