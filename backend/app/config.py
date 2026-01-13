"""
Filename: config.py
Purpose: Application configuration for development, including upload folder and file size limits.
"""
import os

class DevelopmentConfig:
    DEBUG = True
    TESTING = False

    # Resolve path to backend/ directory (two levels up from this file)
    _BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_FOLDER = os.path.join(_BACKEND_DIR, "uploads")

    # Max 2 GB uploads to support large videos and directories
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024 * 1024
