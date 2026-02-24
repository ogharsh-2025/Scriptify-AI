import cv2
import pytesseract
from PIL import Image
import numpy as np
import os

# Tesseract path (Windows)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def extract_text_from_image(image_path):
    if not os.path.exists(image_path):
        return ""

    try:
        # Read image using OpenCV
        img = cv2.imread(image_path)

        if img is None:
            print("Failed to read image")
            return ""

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Increase contrast
        gray = cv2.adaptiveThreshold(
            gray,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            31,
            2
        )

        # Noise removal
        kernel = np.ones((1, 1), np.uint8)
        gray = cv2.morphologyEx(gray, cv2.MORPH_OPEN, kernel)

        # OCR
        text = pytesseract.image_to_string(
            gray,
            lang="eng",
            config="--psm 6"
        )

        print("OCR OUTPUT:", text)
        return text.strip()

    except Exception as e:
        print("OCR ERROR:", e)
        return ""
