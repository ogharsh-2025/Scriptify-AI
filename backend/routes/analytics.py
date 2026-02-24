from flask import Blueprint, jsonify
from models.translation_model import get_analytics

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics', methods=['GET'])
def fetch_analytics():
    try:
        stats = get_analytics()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
