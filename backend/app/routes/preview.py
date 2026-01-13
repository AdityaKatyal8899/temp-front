"""
Filename: preview.py
Purpose: Defines the GET /preview/<access_code>/<file_id> endpoint to validate
the session and serve an inline preview URL for a specific file within the session.
Rules:
- Validate access code and expiry
- Do NOT increment download count
- Images/videos/pdfs -> redirect to preview-safe URL (no dl=1)
- Others -> 415 Unsupported Media Type
"""

from flask import Blueprint, redirect
import os
from ..utils.validators import validate_string
from ..utils.responses import error
from ..services import storage
from ..services.expiry import is_expired


preview_bp = Blueprint("preview", __name__)


@preview_bp.route("/preview/<access_code>/<file_id>", methods=["GET"])  # HEAD not strictly needed for embedding
def preview(access_code: str, file_id: str):
    # Lazy cleanup on request
    storage.delete_expired_files(is_expired)

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
    original_name = (file_rec.get("filename") or "").lower()
    resource_type = (file_rec.get("resource_type") or "").lower()
    public_id = file_rec.get("cloudinary_public_id")

    if not file_url:
        return error("File missing", status=404)

    # If using Cloudinary, ensure we don't force download. For raw resource (e.g., pdf), avoid fl_attachment/dl=1.
    # We will return a redirect to the Cloudinary URL without attachment flags, which is safe for embedding tags.
    # Basic type detection from known metadata/filename
    is_image = resource_type == "image" or any(original_name.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"])
    is_video = resource_type == "video" or any(original_name.endswith(ext) for ext in [".mp4", ".webm", ".ogg", ".mov"]) 
    is_pdf = original_name.endswith(".pdf") or "pdf" in (file_rec.get("mime_type", "").lower())

    # Cloudinary raw (pdf/zip) delivery: build raw base if needed
    if resource_type == "raw" and public_id:
      cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
      if not cloud_name:
          return error("Server misconfigured: CLOUDINARY_CLOUD_NAME missing", status=500)
      base_raw_url = f"https://res.cloudinary.com/{cloud_name}/raw/upload/{public_id}"
      if is_pdf:
          return redirect(base_raw_url)
      # Other raw types are not supported for inline preview
      return error("Preview not supported", status=415)

    # For image/video types (or when file_url already points to a Cloudinary delivery URL), return it directly without dl=1
    if is_image or is_video:
        # Remove any dl or attachment flags if present to avoid forced download
        cleaned = file_url
        # Strip common download params
        for key in ["dl", "attachment", "filename"]:
            if f"{key}=" in cleaned:
                cleaned = cleaned.split("?")[0]
        return redirect(cleaned)

    if is_pdf:
        return redirect(file_url.split("?")[0])

    return error("Preview not supported", status=415)
