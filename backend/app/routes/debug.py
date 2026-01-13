"""
Filename: debug.py
Purpose: Debug-only routes. Provides a manual kill-switch to force expiry cleanup.
"""

from flask import Blueprint
from ..utils.responses import success
from ..services import storage
from ..services.expiry import is_expired


debug_bp = Blueprint("debug", __name__)


@debug_bp.route("/__debug__/force-expiry", methods=["POST"])
def force_expiry():
    deleted = storage.delete_expired_files(is_expired)
    return success({"deleted": int(deleted)})
