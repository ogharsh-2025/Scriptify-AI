from flask import Blueprint, request, jsonify

converter_bp = Blueprint('script_converter', __name__)

# Helper mappings
MORSE_CODE_DICT = { 'A':'.-', 'B':'-...', 'C':'-.-.', 'D':'-..', 'E':'.', 
                    'F':'..-.', 'G':'--.', 'H':'....', 'I':'..', 'J':'.---', 
                    'K':'-.-', 'L':'.-..', 'M':'--', 'N':'-.', 'O':'---', 
                    'P':'.--.', 'Q':'--.-', 'R':'.-.', 'S':'...', 'T':'-', 
                    'U':'..-', 'V':'...-', 'W':'.--', 'X':'-..-', 'Y':'-.--', 
                    'Z':'--..', '1':'.----', '2':'..---', '3':'...--', 
                    '4':'....-', '5':'.....', '6':'-....', '7':'--...', 
                    '8':'---..', '9':'----.', '0':'-----', ', ':'--..--', 
                    '.':'.-.-.-', '?':'..--..', '/':'-..-.', '-':'-....-', 
                    '(':'-.--.', ')':'-.--.-'}

HINDI_TO_ROMAN = {
    'अ':'a', 'आ':'aa', 'इ':'i', 'ई':'ee', 'उ':'u', 'ऊ':'oo', 'ए':'e', 'ऐ':'ai', 'ओ':'o', 'औ':'au',
    'क':'k', 'ख':'kh', 'ग':'g', 'घ':'gh', 'च':'ch', 'छ':'chh', 'ज':'j', 'झ':'jh', 'ट':'t', 'ठ':'th',
    'ड':'d', 'ढ':'dh', 'त':'t', 'थ':'th', 'द':'d', 'ध':'dh', 'न':'n', 'प':'p', 'फ':'ph', 'ब':'b',
    'भ':'bh', 'म':'m', 'य':'y', 'र':'r', 'ल':'l', 'व':'v', 'श':'sh', 'ष':'sh', 'स':'s', 'ह':'h',
    'ा':'aa', 'ि':'i', 'ी':'ee', 'ु':'u', 'ू':'oo', 'े':'e', 'ै':'ai', 'ो':'o', 'ौ':'au', '्':'',
    'ं':'n', 'ः':'h'
}

def to_pig_latin(text):
    words = text.split()
    pig_words = []
    vowels = "aeiouAEIOU"
    for word in words:
        if not word.isalpha():
            pig_words.append(word)
            continue
        if word[0] in vowels:
            pig_words.append(word + "yay")
        else:
            first_vowel_idx = 0
            for i, char in enumerate(word):
                if char in vowels:
                    first_vowel_idx = i
                    break
            if first_vowel_idx == 0: # no vowel
                pig_words.append(word + "ay")
            else:
                pig_words.append(word[first_vowel_idx:] + word[:first_vowel_idx] + "ay")
    return " ".join(pig_words)

@converter_bp.route('/convert-script', methods=['POST'])
def convert_script():
    data = request.get_json()
    if not data or 'text' not in data or 'mode' not in data:
        return jsonify({"error": "text and mode are required"}), 400
        
    text = data.get('text', '')
    mode = data.get('mode', '')
    
    if not text:
        return jsonify({"error": "Empty text"}), 400
        
    try:
        result = ""
        if mode == "binary":
            result = ' '.join(format(ord(i), '08b') for i in text)
        elif mode == "morse":
            text = text.upper()
            result = ' '.join(MORSE_CODE_DICT.get(i, i) for i in text)
        elif mode == "roman_hindi":
            # Simple transliteration approach
            for char in text:
                result += HINDI_TO_ROMAN.get(char, char)
        elif mode == "pig_latin":
            result = to_pig_latin(text)
        else:
            return jsonify({"error": "Invalid mode. Use binary, morse, roman_hindi, or pig_latin"}), 400
            
        return jsonify({
            "original": text,
            "mode": mode,
            "converted": result
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
