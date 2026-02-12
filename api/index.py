"""Vercel Serverless Function entry point for FastAPI backend."""

import sys
from pathlib import Path

# Add the project root (one level up from api/) to Python path
# so that `main.py` and `app/` package can be found
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import app  # noqa: E402
