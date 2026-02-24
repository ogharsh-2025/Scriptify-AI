import os
from flask import Blueprint, request, jsonify, send_file
import speech_recognition as sr
from gtts import gTTS
from deep_translator import GoogleTranslator
from config import Config

voice_bp = Blueprint('voice', __name__)

@voice_bp.route('/voice-translate', methods=['POST'])
def voice_translate():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
        
    audio_file = request.files['audio']
    target_lang = request.form.get('language', 'en')
    source_lang = request.form.get('source_language', 'auto')
    
    # Save uploaded audio
    input_path = os.path.join(Config.UPLOAD_FOLDER, "input_audio.wav")
    audio_file.save(input_path)
    
    try:
        # 1. Speech to text
        recognizer = sr.Recognizer()
        with sr.AudioFile(input_path) as source:
            audio_data = recognizer.record(source)
            # Depending on source_lang, we could pass language to recognize_google
            try:
                text = recognizer.recognize_google(audio_data)
            except sr.UnknownValueError:
                return jsonify({"error": "Could not understand audio"}), 400
            except sr.RequestError:
                return jsonify({"error": "Speech recognition service unavailable"}), 500
                
        # 2. Text translation
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        translated_text = translator.translate(text)
        
        # 3. Text to speech
        tts = gTTS(text=translated_text, lang=target_lang, slow=False)
        output_path = os.path.join(Config.UPLOAD_FOLDER, "output_audio.mp3")
        tts.save(output_path)
        
        # We could return the output_path or stream the file, but we'll return a JSON with texts
        # and a URL to fetch the audio, or we can just send the file back directly.
        # Sending JSON for now. The frontend can fetch the audio via another route or base64.
        
        # Let's send the text along, and provide the audio as a downloadable URL in a real scenario
        # Here we just respond with the file for simplicity, 
        # but to satisfy "return audio output file" we can send the file directly.
        # However, the user also might want the text. 
        # A common pattern: return JSON with texts, have frontend request the audio file.
        
        # For simplicity and strictly fulfilling "Return audio output file":
        return send_file(output_path, as_attachment=True, download_name="translated_audio.mp3")
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
