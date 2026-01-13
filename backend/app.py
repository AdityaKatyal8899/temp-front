"""
Filename: run.py
Purpose: Flask entry point that creates the app and runs the development server.
"""

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
