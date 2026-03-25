#!/usr/bin/env python3

import os
import sys

# Get the absolute path to the backend directory
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_path)

print(f"Python path: {sys.path}")
print(f"Current directory: {os.getcwd()}")

try:
    from app import create_app
    print("✅ Successfully imported create_app")
except ImportError as e:
    print(f"❌ Failed to import create_app: {e}")
    # Try to debug what's available
    try:
        import app
        print("✅ app package imported")
        print(f"app contents: {dir(app)}")
    except ImportError as app_error:
        print(f"❌ app package import failed: {app_error}")
    sys.exit(1)

app = create_app()

if __name__ == '__main__':
    print("🚀 Starting Medic backend...")
    # This only runs when you do: python run.py
    # Gunicorn won't use this block
    
    # Run on all network interfaces so phone can connect
    port = int(os.environ.get('PORT', 5001))
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False
    )