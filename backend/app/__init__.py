"""
Filename: __init__.py
Purpose: Flask app factory; loads configuration, initializes extensions, and registers blueprints.
"""

import os
from flask import Flask
from .config import DevelopmentConfig
from .extensions import cors
from werkzeug.exceptions import RequestEntityTooLarge
from .utils.responses import error as json_error
from .services import storage
from .services.expiry import is_expired


def create_app() -> Flask:
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(DevelopmentConfig)

    # Initialize Cloudinary configuration (loads env vars and configures SDK)
    try:
        from .. import cloudinary_config  # noqa: F401
    except Exception:
        pass

    # Ensure upload directory exists
    upload_folder = app.config.get("UPLOAD_FOLDER")
    if upload_folder and not os.path.exists(upload_folder):
        os.makedirs(upload_folder, exist_ok=True)

    # Initialize extensions
    cors.init_app(app)

    # Ensure expired items are cleaned up on every request (hard-enforced)
    @app.before_request
    def _run_expiry_cleanup():
        storage.delete_expired_files(is_expired)

    # Register blueprints
    from .routes.upload import upload_bp
    from .routes.access import access_bp
    from .routes.download import download_bp
    from .routes.delete import delete_bp
    from .routes.preview import preview_bp
    from .routes.owner import owner_bp
    from .routes.debug import debug_bp
    from .routes.health import health_bp

    app.register_blueprint(upload_bp)
    app.register_blueprint(access_bp)
    app.register_blueprint(download_bp)
    app.register_blueprint(delete_bp)
    app.register_blueprint(preview_bp)
    app.register_blueprint(owner_bp)
    app.register_blueprint(debug_bp)
    app.register_blueprint(health_bp)

    # Return JSON for oversized payloads
    @app.errorhandler(RequestEntityTooLarge)
    def handle_413(_e):
        return json_error("Upload exceeds server limit (2GB)", status=413)

    return app
