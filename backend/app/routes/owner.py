"""
Filename: owner.py
Purpose: Defines endpoints for owner dashboard: retrieve upload session via owner_code and delete the session.
"""
from flask import Blueprint
from ..utils.responses import success, error
from ..services import storage
from ..services.expiry import is_expired


owner_bp = Blueprint("owner", __name__)


@owner_bp.route("/owner/<owner_code>", methods=["GET"])
def owner_get(owner_code: str):
    # Sanitize incoming code to support hyphenated or formatted inputs
    cleaned = "".join(ch for ch in owner_code if ch.isalnum()).upper()
    print(f"[OWNER] lookup start owner_code={owner_code} cleaned={cleaned}")
    found = storage.get_session_by_owner(cleaned)
    if not found:
        print(f"[OWNER] lookup miss owner_code={owner_code} cleaned={cleaned}")
        return error("Not found", status=404)

    access_code, sess = found
    if is_expired(sess.get("expires_at")):
        print(f"[OWNER] lookup hit (expired) owner_code={owner_code} cleaned={cleaned} access_code={access_code}")
        return error("Expired", status=410)
    status = "active"
    print(f"[OWNER] lookup hit owner_code={owner_code} cleaned={cleaned} access_code={access_code} status={status}")

    files = sess.get("files") or []
    first = files[0] if files else {}
    data = {
        "upload_id": sess.get("upload_id"),
        "access_code": access_code,
        "owner_code": sess.get("owner_code"),
        "uploaded_at": sess.get("uploaded_at"),
        "expires_at": sess.get("expires_at"),
        "download_count": sess.get("download_count", 0),
        "preview_file_id": sess.get("preview_file_id"),
        "files": [
            {
                "file_id": f.get("file_id"),
                "filename": f.get("filename"),
                "size": f.get("size"),
                "mime_type": f.get("mime_type"),
                "download_count": f.get("download_count", 0),
            }
            for f in files
        ],
        # Back-compat fields for UIs expecting single-file metadata
        "filename": first.get("filename"),
        "size": first.get("size"),
        "type": first.get("mime_type"),
        "status": status,
    }
    return success(data)


@owner_bp.route("/owner/<owner_code>/delete", methods=["DELETE"])
def owner_delete(owner_code: str):
    cleaned = "".join(ch for ch in owner_code if ch.isalnum()).upper()
    print(f"[OWNER] delete start owner_code={owner_code} cleaned={cleaned}")
    found = storage.get_session_by_owner(cleaned)
    if not found:
        print(f"[OWNER] delete miss owner_code={owner_code} cleaned={cleaned}")
        return error("Not found", status=404)

    access_code, _sess = found
    deleted = storage.delete_session(access_code)
    storage.remove_owner_mapping(cleaned)
    print(f"[OWNER] delete done owner_code={owner_code} cleaned={cleaned} access_code={access_code} files_deleted={deleted}")
    return success({"owner_code": cleaned, "access_code": access_code, "files_deleted": deleted}, message="Deleted")
