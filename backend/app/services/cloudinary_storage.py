"""
Authoritative Cloudinary delete handler.
This MUST be called for every delete (expiry or owner).
"""

import cloudinary.uploader  # type: ignore


def force_delete_cloud_asset(public_id: str, resource_type: str | None = None) -> None:
    if not public_id:
        raise RuntimeError("Cloudinary public_id is missing")

    # Cloudinary destroy requires resource_type to be one of: image, video, raw
    allowed = {"image", "video", "raw"}
    rt = (resource_type or "raw").lower()
    if rt not in allowed:
        rt = "raw"

    result = cloudinary.uploader.destroy(
        public_id,
        resource_type=rt,
        invalidate=True,
    )

    # Treat 'ok' and 'not found' as successful/idempotent outcomes
    if not isinstance(result, dict):
        raise RuntimeError(f"Cloudinary deletion failed: {result}")
    outcome = (result.get("result") or "").lower()
    if outcome not in {"ok", "not found"}:
        raise RuntimeError(f"Cloudinary deletion failed: {result}")

    print("[CLOUDINARY][FORCED DELETE]", "OK" if outcome == "ok" else "NOT FOUND (treated ok)", public_id)
