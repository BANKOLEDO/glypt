"""Exceptions raised by the Glypt SDK."""


class GlyptError(Exception):
    """Base class for all Glypt errors."""


class ApiError(GlyptError):
    """The API returned a non-2xx response."""

    def __init__(self, status: int, message: str):
        self.status = status
        self.message = message
        super().__init__(f"[{status}] {message}")


class QuotaExceeded(ApiError):
    """Daily quota exhausted; upgrade or wait for reset."""

    def __init__(self, message: str = "daily search quota reached"):
        super().__init__(429, message)
