"""
Filename: validators.py
Purpose: Provide minimal input validation helpers for files and strings.
"""

import os
import string as _string


def validate_file_exists(path: str) -> bool:
    return bool(path) and os.path.exists(path) and os.path.isfile(path)


def validate_string(value: str, *, min_len: int = 1, max_len: int = 255, allow: str | None = None) -> bool:
    if not isinstance(value, str):
        return False
    value = value.strip()
    if not (min_len <= len(value) <= max_len):
        return False
    if allow is None:
        allow = _string.ascii_letters + _string.digits + "-_"
    return all(ch in allow for ch in value)
