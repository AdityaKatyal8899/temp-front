"""
Filename: download.py
Purpose: Provide download endpoints for sessions and files.

New: GET /download/<access_code>/<file_id> -> download a specific file within a session.
Legacy: GET /download/<access_code> -> download the first file (for single-file sessions/back-compat).
"""

from flask import Blueprint, request, redirect, jsonify
from urllib.parse import quote as urlquote
import os
from ..utils.validators import validate_string
from ..utils.responses import error
from ..services import storage
from ..services.expiry import is_expired
import cloudinary.api  # type: ignore


download_bp = Blueprint("download", __name__)


def force_download_url(url: str) -> str:
    """Ensure Cloudinary delivery URL forces download via fl_attachment.

    We do not proxy bytes; we only transform the delivery URL so that
    Cloudinary returns Content-Disposition for download.
    """
    try:
        if "/upload/" not in url:
            return url
        return url.replace("/upload/", "/upload/fl_attachment/")
    except Exception:
        return url

@download_bp.route("/download/<access_code>/<file_id>", methods=["GET"])
def download_file(access_code: str, file_id: str):

    if not validate_string(access_code, min_len=6, max_len=8):
        return error("Invalid access code", status=400)

    session = storage.get_session(access_code)
    if not session:
        return error("Not found", status=404)
    if is_expired(session.get("expires_at")):
        return error("Expired", status=410)

    files = session.get("files") or []
    file_rec = next((f for f in files if f.get("file_id") == file_id), None)
    if not file_rec:
        return error("File not found in session", status=404)

    file_url = file_rec.get("file_url")

    try:
        if request.method != "HEAD":
            try:
                storage.increment_download_count(access_code, file_id)
            except Exception:
                pass

        if not file_url:
            return error("File missing", status=404)

        # Force download by inserting fl_attachment into the Cloudinary delivery URL.
        download_url = force_download_url(file_url)
        return redirect(download_url, code=302)
    except FileNotFoundError:
        return error("File missing", status=404)
    except Exception:
        return error("Failed to download", status=500)


@download_bp.route("/download/<access_code>", methods=["GET"])
def download_legacy(access_code: str):
    """Back-compat: download the first (or only) file in a session."""
    if not validate_string(access_code, min_len=6, max_len=8):
        return error("Invalid access code", status=400)
    session = storage.get_session(access_code)
    if not session:
        return error("Not found", status=404)
    if is_expired(session.get("expires_at")):
        return error("Expired", status=410)
    files = session.get("files") or []
    if not files:
        return error("No files in session", status=404)
    first = files[0]
    return download_file(access_code, first.get("file_id"))


@download_bp.route("/download/batch", methods=["POST"])
def download_batch():
    """Create a ZIP of selected files in a session and return an archive URL.

    Expected JSON payload: { "access_code": "ABC123", "file_ids": ["f1_XXXX", "f2_YYYY"] }
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
    except Exception:
        data = {}
    access_code = (data.get("access_code") or "").strip().upper()
    file_ids = data.get("file_ids") or []

    if not validate_string(access_code, min_len=6, max_len=8):
        return error("Invalid access code", status=400)
    if not isinstance(file_ids, list) or not file_ids:
        return error("file_ids must be a non-empty array", status=400)

    session = storage.get_session(access_code)
    if not session:
        return error("Not found", status=404)
    if is_expired(session.get("expires_at")):
        return error("Expired", status=410)

    files = session.get("files") or []
    selected = [f for f in files if f.get("file_id") in set(file_ids)]
    if not selected:
        return error("No matching files in session", status=400)

    # Build Cloudinary resources list
    resources = []
    for f in selected:
        pid = f.get("cloudinary_public_id")
        rtype = (f.get("resource_type") or "auto").lower()
        if not pid:
            continue
        # Cloudinary expects resource_type in {image, video, raw}
        if rtype not in ("image", "video", "raw"):
            rtype = "raw"
        resources.append({"public_id": pid, "resource_type": rtype})

    if not resources:
        return error("Selected files are not available for bundling", status=400)

    try:
        # Generate archive URL (non-blocking zip creation on Cloudinary side)
        resp = cloudinary.api.generate_archive(
            resources=resources,
            flatten_folders=True,
            allow_missing=True,
            target_public_id=None,
            mode="download",
        )
        archive_url = resp.get("url")
        if not archive_url:
            return error("Failed to create archive", status=500)
        # Increment session-level count once
        try:
            storage.increment_download_count(access_code)
        except Exception:
            pass
        return jsonify({"success": True, "archive_url": archive_url})
    except Exception as e:
        print(f"[BATCH][ERROR] {e}")
        return error("Failed to create batch archive", status=500)
