"""
Filename: extensions.py
Purpose: Initialize Flask extensions used by the application (CORS only for now).
"""

from flask_cors import CORS

# CORS instance to be initialized in the app factory
cors = CORS(
    resources={
        r"*": {
            "origins": ["http://localhost:5173"],
            "methods": ["GET", "POST", "DELETE"],
        }
    }
)
