"""
Filename: delete.py
Purpose: Defines the DELETE /delete/<code> endpoint to manually delete a stored file and its metadata.
"""

from flask import Blueprint
from ..utils.validators import validate_string
from ..utils.responses import success, error
from ..services import storage


delete_bp = Blueprint("delete", __name__)


@delete_bp.route("/delete/<code>", methods=["DELETE"])
def delete(code: str):
    if not validate_string(code, min_len=6, max_len=8):
        return error("Invalid access code", status=400)

    entry = storage.get_entry(code)
    if not entry:
        return error("Not found", status=404)

    public_id = entry.get("cloudinary_public_id")
    res_type = entry.get("cloudinary_resource_type")
    deleted = storage.delete_cloud_asset(public_id, res_type)
    storage.remove_entry(code)

    if not deleted:
        # Even if file missing, consider metadata removal as success
        return success({"code": code}, message="Deleted (file missing)")
    return success({"code": code}, message="Deleted")
