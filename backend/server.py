# backend/server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
import traceback
import sys
import os

# local import
from interpreter import load_commands, run_code

app = Flask(__name__)
# allow Electron renderer to fetch local backend
CORS(app)

BASE_DIR = Path(__file__).parent
FUNCTIONS_DIR = BASE_DIR / "functions"

@app.route("/ping", methods=["GET"])
def ping():
    return "OpenCode backend is running!"

@app.route("/run", methods=["POST"])
def run():
    try:
        payload = request.get_json(force=True)
        code = payload.get("code", "")
        # reload modules every run so new .py functions are picked up
        commands = load_commands(FUNCTIONS_DIR)
        output = run_code(code, commands)
        return jsonify({"output": output})
    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        return jsonify({"output": f"[Server Error] {e}"}), 500

@app.route("/functions", methods=["GET"])
def list_functions():
    """
    Returns a list of available OpenCode function files (without .py extension).
    This is used by the IDE sidebar.
    """
    try:
        files = [
            f[:-3]
            for f in os.listdir(FUNCTIONS_DIR)
            if f.endswith(".py") and not f.startswith("__")
        ]
        return jsonify(files)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # host 0.0.0.0 to ensure reachable; debug True for dev
    app.run(host="0.0.0.0", port=5000, debug=True)
