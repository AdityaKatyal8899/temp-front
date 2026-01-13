"""
Filename: expiry.py
Purpose: Provide fixed expiry duration handling, computing expiry timestamps and checking expiration.
"""

import time

# Fixed expiry duration: TEST MODE 30 seconds
EXPIRY_SECONDS = 60 * 60
EXPIRY_HUMAN = "1 Hour"


def now_ts() -> float:
    return time.time()


def compute_expiry(offset_seconds: int | None = None) -> float:
    """Compute expiry timestamp from now plus EXPIRY_SECONDS.

    If offset_seconds is provided, returns now + offset_seconds (used for comparisons/tests).
    """
    if offset_seconds is not None:
        return now_ts() + offset_seconds
    return now_ts() + EXPIRY_SECONDS


def is_expired(expires_at: float | None) -> bool:
    if expires_at is None:
        return False
    return now_ts() >= float(expires_at)
