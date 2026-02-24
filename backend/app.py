import os
from flask import Flask
from flask_cors import CORS

from config import Config
from database import init_db

# Import Blueprints
from routes.detect import detect_bp
from routes.translate import translate_bp
from routes.script_converter import converter_bp
from routes.voice import voice_bp
from routes.analytics import analytics_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend integration
    CORS(app)

    # Make sure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Initialize Database
    init_db()

    # Register Blueprints
    app.register_blueprint(detect_bp)
    app.register_blueprint(translate_bp)
    app.register_blueprint(converter_bp)
    app.register_blueprint(voice_bp)
    app.register_blueprint(analytics_bp)

    @app.route("/", methods=["GET"])
    def home():
        return {"status": "success", "message": "Scriptify API is running"}, 200

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
