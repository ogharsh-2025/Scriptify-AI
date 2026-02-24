import os

class Config:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    DATABASE_URI = os.path.join(BASE_DIR, "scriptify.db")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024 # 16 MB limit
