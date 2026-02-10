"""Vercel Serverless Function entry point for FastAPI backend.

This file serves as the ASGI handler for Vercel's Python Runtime.
Vercel will automatically detect this file and create a serverless function.
"""

from main import app

# Vercel expects the ASGI app to be named 'app'
# The FastAPI instance in main.py is already named 'app'
