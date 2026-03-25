# app/__init__.py
from flask import Flask, request
from flask_cors import CORS
from app.config.firebase import initialize_firebase
import logging
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)

    # ── CORS ────────────────────────────────────────────────────────────────
    CORS(app,
        origins=[
            "http://localhost:19006",
            "http://localhost:8081",
            "exp://10.10.62.45:8081",
            "http://10.10.62.45:8081",
            "http://10.10.62.45:19006",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:4173",
            "http://localhost:5001",
            "http://10.10.62.45:5001",
            "https://medic-production.up.railway.app",
            "https://medic.vercel.app",
            "exp://*"
        ],
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"]
    )

    # ── OPTIONS preflight — must be here, before any route/auth processing ──
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            return '', 200

    # ── Config ───────────────────────────────────────────────────────────────
    app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', '')

    logging.basicConfig(level=logging.INFO)

    # ── Firebase ─────────────────────────────────────────────────────────────
    if not initialize_firebase():
        logging.error("Failed to initialize Firebase")

    # ── Routes ───────────────────────────────────────────────────────────────
    from app.routes import health, auth, user
    from app.routes import admin, staff

    health.register_routes(app)
    auth.register_routes(app)
    user.register_routes(app)
    admin.register_routes(app)
    staff.register_routes(app)

    return app