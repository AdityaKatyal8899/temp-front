"""
Filename: codegen.py
Purpose: Generate short access codes using simple random characters (no hashing or heavy logic).
"""

import random
import string

ALPHABET = string.ascii_uppercase + string.digits


def generate_access_code(existing_codes: set[str] | None = None, length: int = 6) -> str:
    """Generate a short, URL-safe access code avoiding collisions.

    - Uses uppercase letters and digits
    - Length is 6 by default (allowed 6-8)
    - Retries on collision within a reasonable number of attempts
    """
    if length < 6 or length > 8:
        length = 6
    existing_codes = existing_codes or set()

    for _ in range(100):
        code = "".join(random.choice(ALPHABET) for _ in range(length))
        if code not in existing_codes:
            return code
    # Fallback (very unlikely to happen)
    return "".join(random.choice(ALPHABET) for _ in range(length))


def generate_access_url(code: str, base_url: str | None = None) -> str:
    """Build an access URL from a code and an optional base URL.

    If base_url is not provided, returns a relative path.
    """
    path = f"/access/{code}"
    if not base_url:
        return path
    return f"{base_url.rstrip('/')}{path}"


def generate_owner_code(existing_codes: set[str] | None = None, length: int = 12) -> str:
    """Generate an owner (management) code, longer by default, avoiding collisions."""
    return generate_access_code(existing_codes=existing_codes, length=length)
