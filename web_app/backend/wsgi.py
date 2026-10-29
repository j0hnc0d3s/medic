# wsgi.py - Entry point for Gunicorn on Render

from app import create_app
import os

# Create the Flask application
app = create_app()

if __name__ == "__main__":
    # This is for local development only
    # Render will use: gunicorn wsgi:app
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
