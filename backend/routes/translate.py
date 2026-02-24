import os
from flask import Blueprint, request, jsonify
from deep_translator import GoogleTranslator
from ocr import extract_text_from_image
from models.translation_model import save_translation, get_history, clear_history
from config import Config

translate_bp = Blueprint('translate', __name__)

@translate_bp.route('/translate-text', methods=['POST'])
def translate_text_api():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
        
    text = data.get('text', '')
    target_lang = data.get('language', 'en')
    source_lang = data.get('source_language', 'auto')
    
    if not text:
        return jsonify({"error": "Empty text"}), 400
        
    try:
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        translated = translator.translate(text)
        
        actual_source = source_lang
        
        save_translation(
            input_text=text,
            translated_text=translated,
            source_language=actual_source,
            target_language=target_lang,
            translation_length=len(text)
        )
        
        return jsonify({"result": translated}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@translate_bp.route('/translate-image', methods=['POST'])
def translate_image_api():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
        
    image = request.files['image']
    target_lang = request.form.get('language', 'en')
    source_lang = request.form.get('source_language', 'auto')
    
    path = os.path.join(Config.UPLOAD_FOLDER, image.filename)
    image.save(path)
    
    extracted_text = extract_text_from_image(path)
    
    if not extracted_text:
        return jsonify({"error": "OCR failed or no text found"}), 400
        
    try:
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        translated = translator.translate(extracted_text)
        
        save_translation(
            input_text=extracted_text,
            translated_text=translated,
            source_language=source_lang,
            target_language=target_lang,
            translation_length=len(extracted_text)
        )
        
        return jsonify({
            "extracted_text": extracted_text,
            "translated_text": translated
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@translate_bp.route('/get-history', methods=['GET'])
def fetch_history():
    try:
        limit = request.args.get('limit', 50, type=int)
        history = get_history(limit)
        return jsonify({"history": history}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@translate_bp.route('/delete-history', methods=['DELETE'])
def delete_history_api():
    try:
        clear_history()
        return jsonify({"message": "History cleared successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
