"""
Filename: extensions.py
Purpose: Initialize Flask extensions used by the application (CORS only for now).
"""

from flask_cors import CORS

# CORS instance to be initialized in the app factory
# Allow local dev and deployed Vercel frontend to call the Render backend
cors = CORS(
    resources={
        r"/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://temp-front-tau.vercel.app",
            ],
            "methods": ["GET", "POST", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type"],
            "supports_credentials": False,
        }
    }
)
