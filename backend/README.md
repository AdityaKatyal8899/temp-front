"""
Filename: README.md
Purpose: Basic instructions to run the Flask backend for the temporary file sharing service.
"""

# Temporary File Sharing - Flask Backend (Skeleton)

This is a minimal Flask backend using only local filesystem storage. No database, no auth, no background jobs.

## Setup

- Ensure Python 3.10+ is installed.
- From the `backend/` directory:

```bash
pip install -r requirements.txt
python run.py
```

You should see:

```
Running on http://127.0.0.1:5000
```

## Endpoints

- POST `/upload`
  - Form-Data: `file` (the uploaded file)
  - Saves file to `backend/uploads/` and returns a mock access code.

- GET `/access/<code>`
  - Validates the `code` and returns mock file metadata.

## Notes

- Configuration is in `app/config.py` (upload folder and max content length).
- CORS is enabled via `app/extensions.py`.
- No database or expiration logic is implemented yet.
