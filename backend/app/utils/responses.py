"""
Filename: responses.py
Purpose: Provide standard JSON success and error response helpers.
"""

from flask import jsonify


def success(data=None, message: str = "OK", status: int = 200):
    payload = {"success": True, "message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


def error(message: str = "Error", status: int = 400):
    payload = {"success": False, "error": message}
    return jsonify(payload), status
