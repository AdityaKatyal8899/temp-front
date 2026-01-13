"""
Filename: upload.py
Purpose: POST /upload accepts one or more files and creates a single upload session
with a single access_code/owner_code. All files in the request are grouped
into that session.
"""

import time
import random
from flask import Blueprint, request
from ..services import storage
from ..services.codegen import generate_access_code, generate_access_url, generate_owner_code, ALPHABET
from ..services.expiry import compute_expiry, EXPIRY_HUMAN, is_expired
from ..utils.responses import success, error


upload_bp = Blueprint("upload", __name__)


@upload_bp.route("/upload", methods=["POST"])
def upload():
    # Lazy cleanup of expired files/entries
    storage.delete_expired_files(is_expired)
    try:
        print(f"[DEBUG] Upload Content-Length: {request.content_length}")
    except Exception:
        pass

    # Collect inputs: support single or multiple files
    files_multi = []
    for field in ("files", "files[]", "file"):
        files_multi.extend(request.files.getlist(field))
    files_multi = [f for f in files_multi if getattr(f, "filename", "")]
    if not files_multi:
        return error("No files provided", status=400)

    # Directory heuristic remains but we now always create one session
    is_directory = any(("/" in f.filename) or ("\\" in f.filename) for f in files_multi)

    # Size limits (bytes)
    GB = 1024 * 1024 * 1024
    MB = 1024 * 1024
    LIMIT_DIR = 2 * GB
    LIMIT_VIDEO = 2 * GB
    LIMIT_AUDIO = 50 * MB
    LIMIT_FILE = 100 * MB

    existing = storage.list_access_codes()
    code = generate_access_code(existing_codes=existing)
    owner_code = generate_owner_code(existing_codes=set())
    expires_at = compute_expiry()
    uploaded_at = time.time()

    # Simple upload_id generator (timestamp + random)
    upload_id = f"upl_{int(uploaded_at)}_{''.join(random.choice(ALPHABET) for _ in range(6))}"
    storage.create_session(
        access_code=code,
        owner_code=owner_code,
        expires_at=expires_at,
        uploaded_at=uploaded_at,
        upload_id=upload_id,
    )

    # Validate total size for directory uploads
    if is_directory:
        total_size = 0
        for f in files_multi:
            total_size += storage.file_size_bytes(f)
            if total_size > LIMIT_DIR:
                return error("Directory exceeds 2GB limit", status=400)

    uploaded_files = []
    for idx, file in enumerate(files_multi):
        mimetype = getattr(file, "mimetype", "") or ""
        size_b = storage.file_size_bytes(file)
        if mimetype.startswith("video/"):
            if size_b > LIMIT_VIDEO:
                return error("Video exceeds 2GB limit", status=400)
        elif mimetype.startswith("audio/"):
            if size_b > LIMIT_AUDIO:
                return error("Audio exceeds 50MB limit", status=400)
        else:
            if size_b > LIMIT_FILE:
                return error("File exceeds 100MB limit", status=400)

        try:
            saved = storage.save_file(file)
            try:
                print(f"[CLOUDINARY] file uploaded: {saved.get('public_id')} url={saved.get('url')}")
            except Exception:
                pass
        except ValueError as ve:
            return error(str(ve), status=400)
        except Exception:
            return error("Failed to save file", status=500)

        file_id = f"f{idx+1}_{''.join(random.choice(ALPHABET) for _ in range(4))}"
        storage.add_file_to_session(
            access_code=code,
            file_id=file_id,
            original_name=saved["original"],
            size_bytes=size_b,
            mime_type=mimetype,
            cloudinary_public_id=saved.get("public_id"),
            resource_type=saved.get("resource_type"),
            file_url=saved.get("url"),
        )
        uploaded_files.append({
            "file_id": file_id,
            "filename": saved["original"],
            "size": size_b,
            "mime_type": mimetype,
        })

    access_url = generate_access_url(code)
    return success(
        {
            "upload_id": upload_id,
            "access_code": code,
            "owner_code": owner_code,
            "access_url": access_url,
            "expires_in": EXPIRY_HUMAN,
            "files": uploaded_files,
        },
        message="Uploaded",
        status=201,
    )
