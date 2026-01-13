"""
Filename: access.py
Purpose: GET /access/<code> returns upload session metadata and file list for the given access code.
"""

from flask import Blueprint
from ..utils.validators import validate_string
from ..utils.responses import error, success
from ..services import storage
from ..services.expiry import is_expired


access_bp = Blueprint("access", __name__)


@access_bp.route("/access/<code>", methods=["GET"])
def access(code: str):
    # Lazy cleanup on access
    storage.delete_expired_files(is_expired)

    if not validate_string(code, min_len=6, max_len=8):
        return error("Invalid access code", status=400)

    session = storage.get_session(code)
    if not session:
        return error("Not found", status=404)

    if is_expired(session.get("expires_at")):
        return error("Expired", status=410)

    data = {
        "upload_id": session.get("upload_id"),
        "access_code": session.get("access_code"),
        "owner_code": session.get("owner_code"),
        "uploaded_at": session.get("uploaded_at"),
        "expires_at": session.get("expires_at"),
        "download_count": session.get("download_count", 0),
        "preview_file_id": session.get("preview_file_id"),
        "files": [
            {
                "file_id": f.get("file_id"),
                "filename": f.get("filename"),
                "size": f.get("size"),
                "mime_type": f.get("mime_type"),
                "download_count": f.get("download_count", 0),
            }
            for f in (session.get("files") or [])
        ],
    }
    return success(data)
