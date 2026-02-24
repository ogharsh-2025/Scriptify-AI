from flask import Blueprint, request, jsonify
from langdetect import detect, detect_langs

detect_bp = Blueprint('detect', __name__)

@detect_bp.route('/detect-language', methods=['POST'])
def detect_language():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
        
    text = data.get('text', '').strip()
    if not text:
        return jsonify({"error": "Empty text"}), 400
        
    try:
        # Detect primary language
        primary_lang = detect(text)
        
        # Get language probabilities
        langs = detect_langs(text)
        confidence = langs[0].prob if langs else 0.0
        
        # Infer script type roughly based on detected language
        script_type = "Latin" # Default
        if primary_lang in ['hi', 'mr', 'ne']:
            script_type = "Devanagari"
        elif primary_lang in ['ar', 'ur', 'fa']:
            script_type = "Arabic"
        elif primary_lang in ['zh-cn', 'zh-tw']:
            script_type = "Han"
        elif primary_lang in ['ja']:
            script_type = "Kanji/Kana"
        elif primary_lang in ['ko']:
            script_type = "Hangul"
        elif primary_lang in ['ru', 'bg', 'uk']:
            script_type = "Cyrillic"
            
        return jsonify({
            "detected_language": primary_lang,
            "confidence_score": round(confidence, 4),
            "detected_script": script_type
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
