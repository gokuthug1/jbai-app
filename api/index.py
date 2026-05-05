import sys
import os

# Add the root and backend directories to sys.path
# This allows us to import the 'app' package from the 'backend' folder
current_dir = os.path.dirname(__file__)
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# Import the FastAPI instance from backend/app/main.py
try:
    from app.main import app
except ImportError as e:
    print(f"Error importing app: {e}")
    print(f"sys.path: {sys.path}")
    raise e

# Vercel needs the app object to be named 'app' or for the module to be called 'index'
# with an 'app' or 'handler' object.
handler = app
