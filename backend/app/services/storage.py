"""
Filename: storage.py
Purpose: Provide local filesystem storage utilities: save files and a stub for delete.
"""

import os
import json
import time
import shutil
import zipfile
from typing import Dict, Optional, Iterable, Tuple
from flask import current_app
import cloudinary  # type: ignore
import cloudinary.uploader  # type: ignore
from werkzeug.utils import secure_filename
from .cloudinary_storage import force_delete_cloud_asset

_metadata_loaded = False
_metadata: Dict[str, dict] = {}
_metadata_path: Optional[str] = None


def _get_upload_folder() -> str:
    folder = current_app.config.get("UPLOAD_FOLDER")
    if not folder:
        raise RuntimeError("UPLOAD_FOLDER is not configured")
    os.makedirs(folder, exist_ok=True)
    return folder


def _get_metadata_path() -> str:
    global _metadata_path
    if _metadata_path is None:
        _metadata_path = os.path.join(_get_upload_folder(), "metadata.json")
    return _metadata_path


def _ensure_loaded() -> None:
    global _metadata_loaded, _metadata
    if _metadata_loaded:
        return
    path = _get_metadata_path()
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                _metadata = json.load(f)
        except Exception:
            _metadata = {}
    else:
        _metadata = {}
    # Ensure container keys exist
    if "_owner_index" not in _metadata:
        _metadata["_owner_index"] = {}
    # Sessions map access_code -> session dict
    if "_sessions" not in _metadata:
        _metadata["_sessions"] = {}
    _metadata_loaded = True


def _persist() -> None:
    path = _get_metadata_path()
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(_metadata, f)
    os.replace(tmp, path)


def save_file(file_obj) -> Dict[str, str]:
    if file_obj is None or getattr(file_obj, "filename", "") == "":
        raise ValueError("Invalid file object")

    original = secure_filename(file_obj.filename)
    if not original:
        raise ValueError("Invalid filename")

    # Upload to Cloudinary (chunked, supports large videos)
    try:
        result = cloudinary.uploader.upload(
            file_obj,
            resource_type="auto",
            folder="temp-share",
            chunk_size=6000000,
        )
    except Exception as e:
        print(f"[CLOUDINARY][UPLOAD ERROR] single file: {e}")
        raise
    file_url = result.get("secure_url")
    public_id = result.get("public_id")
    res_type = result.get("resource_type")
    print(f"[CLOUDINARY] uploaded: {public_id}")
    return {"url": file_url, "public_id": public_id, "resource_type": res_type, "original": original}


def create_session(access_code: str, owner_code: str, expires_at: float, uploaded_at: float, upload_id: str) -> None:
    """Create a new upload session keyed by access_code and owner_code."""
    _ensure_loaded()
    _metadata.setdefault("_sessions", {})[access_code] = {
        "upload_id": upload_id,
        "access_code": access_code,
        "owner_code": owner_code,
        "uploaded_at": uploaded_at,
        "expires_at": expires_at,
        "files": [],
        "preview_file_id": None,
        "download_count": 0,
    }
    _metadata.setdefault("_owner_index", {})[owner_code] = access_code
    _persist()


def add_file_to_session(
    access_code: str,
    *,
    file_id: str,
    original_name: str,
    size_bytes: int,
    mime_type: str,
    cloudinary_public_id: Optional[str],
    resource_type: Optional[str],
    file_url: Optional[str],
) -> None:
    _ensure_loaded()
    session = _metadata.get("_sessions", {}).get(access_code)
    if not session:
        raise KeyError("Session not found")
    record = {
        "file_id": file_id,
        "filename": original_name,
        "size": int(size_bytes),
        "mime_type": mime_type,
        "cloudinary_public_id": cloudinary_public_id,
        "resource_type": resource_type,
        "file_url": file_url,
        "download_count": 0,
    }
    session["files"].append(record)
    # Initialize preview to the first file added
    if not session.get("preview_file_id"):
        session["preview_file_id"] = file_id
    _persist()


def get_session(access_code: str) -> Optional[dict]:
    _ensure_loaded()
    return _metadata.get("_sessions", {}).get(access_code)


def delete_session(access_code: str) -> int:
    """Delete a session and all its files from Cloudinary. Returns number of files deleted."""
    _ensure_loaded()
    sessions = _metadata.get("_sessions", {})
    session = sessions.get(access_code)
    if not session:
        return 0
    files = session.get("files", []) or []
    deleted = 0
    for f in files:
        public_id = f.get("cloudinary_public_id")
        res_type = f.get("resource_type")
        if public_id:
            try:
                force_delete_cloud_asset(public_id, res_type)
            except Exception:
                pass
        deleted += 1
    # remove owner mapping
    try:
        oc = session.get("owner_code")
        if oc and oc in _metadata.get("_owner_index", {}):
            del _metadata["_owner_index"][oc]
    except Exception:
        pass
    del sessions[access_code]
    _persist()
    return deleted


def list_access_codes() -> set:
    _ensure_loaded()
    return set((_metadata.get("_sessions", {}) or {}).keys())


def delete_expired_files(is_expired_func) -> int:
    _ensure_loaded()
    print("[EXPIRY] scanning sessions...")
    sessions = _metadata.get("_sessions", {})
    expired_codes: list[str] = []
    for code, sess in list(sessions.items()):
        if not isinstance(sess, dict):
            continue
        expires_at = sess.get("expires_at")
        if expires_at is None:
            continue
        if is_expired_func(expires_at):
            expired_codes.append(code)

    removed = 0
    for code in expired_codes:
        removed += delete_session(code)
    return removed


def set_owner_mapping(owner_code: str, code: str) -> None:
    _ensure_loaded()
    _metadata.setdefault("_owner_index", {})[owner_code] = code
    _persist()


def get_session_by_owner(owner_code: str) -> Optional[Tuple[str, dict]]:
    _ensure_loaded()
    code = _metadata.get("_owner_index", {}).get(owner_code)
    if not code:
        return None
    sess = _metadata.get("_sessions", {}).get(code)
    if not sess:
        return None
    return code, sess


def remove_owner_mapping(owner_code: str) -> None:
    _ensure_loaded()
    if owner_code in _metadata.get("_owner_index", {}):
        del _metadata["_owner_index"][owner_code]
        _persist()


def increment_download_count(access_code: str, file_id: Optional[str] = None) -> int:
    _ensure_loaded()
    sess = _metadata.get("_sessions", {}).get(access_code)
    if not sess:
        return 0
    if file_id:
        for f in sess.get("files", []) or []:
            if f.get("file_id") == file_id:
                f["download_count"] = int(f.get("download_count", 0)) + 1
                break
    sess["download_count"] = int(sess.get("download_count", 0)) + 1
    _persist()
    return int(sess.get("download_count", 0))


def file_size_bytes(file_obj) -> int:
    """Compute the size of a FileStorage without keeping it loaded.

    This reads the stream cursor position, seeks to end to get size, then restores cursor.
    """
    stream = file_obj.stream
    try:
        pos = stream.tell()
        stream.seek(0, os.SEEK_END)
        size = stream.tell()
        stream.seek(pos, os.SEEK_SET)
        return int(size)
    except Exception:
        return 0


def save_directory_zip(files: Iterable, original_folder: Optional[str] = None) -> Dict[str, str]:
    """Save multiple uploaded files representing a directory into a zip file.

    Preserves relative paths based on incoming filenames (which may include subpaths).
    Returns dict with 'filename' (zip name), 'path' (zip full path), and 'original' (folder name).
    """
    folder = _get_upload_folder()

    # Determine original folder name
    if not original_folder:
        original_folder = "folder"
        for f in files:
            name = secure_filename(getattr(f, "filename", ""))
            if "/" in name or "\\" in name:
                original_folder = name.split("/")[0].split("\\")[0]
                break

    base_name = secure_filename(original_folder) or "folder"
    zip_name = f"{base_name}.zip"
    counter = 1
    while os.path.exists(os.path.join(folder, zip_name)):
        zip_name = f"{base_name}_{counter}.zip"
        counter += 1

    zip_path = os.path.join(folder, zip_name)

    with zipfile.ZipFile(zip_path, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            rel = getattr(f, "filename", "") or "file"
            # Normalize and remove leading separators
            rel = rel.lstrip("/\\")
            # Ensure safe path segments
            rel = "/".join(secure_filename(p) for p in rel.split("/")).replace("\\", "/")
            if not rel:
                rel = "file"
            # Write file content into zip under the relative path
            # Need to read content; reset after
            stream = f.stream
            stream_pos = stream.tell()
            data = stream.read()
            zf.writestr(rel, data)
            stream.seek(stream_pos)

    # Upload zip to Cloudinary then remove local zip
    try:
        result = cloudinary.uploader.upload(
            zip_path,
            resource_type="raw",
            folder="temp-share",
            chunk_size=6000000,
            use_filename=True,
            unique_filename=False,
            public_id=base_name,  # ensure no .zip in public_id
        )
    except Exception as e:
        print(f"[CLOUDINARY][UPLOAD ERROR] zip: {e}")
        raise
    try:
        os.remove(zip_path)
    except Exception:
        pass
    file_url = result.get("secure_url")
    public_id = result.get("public_id")
    res_type = result.get("resource_type")
    print(f"[CLOUDINARY] uploaded: {public_id}")
    return {"url": file_url, "public_id": public_id, "resource_type": res_type, "original": zip_name}


def delete_cloud_asset(public_id: Optional[str], resource_type: Optional[str] = None) -> bool:
    """Delete a Cloudinary asset by public ID, raising if it fails."""
    if not public_id:
        raise RuntimeError("Cloudinary public_id is missing")
    force_delete_cloud_asset(public_id, resource_type)
    return True
