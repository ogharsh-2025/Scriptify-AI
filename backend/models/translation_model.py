from database import get_db_connection

def save_translation(input_text, translated_text, source_language, target_language, translation_length):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO translation_history 
        (input_text, translated_text, source_language, target_language, translation_length)
        VALUES (?, ?, ?, ?, ?)
    ''', (input_text, translated_text, source_language, target_language, translation_length))
    conn.commit()
    conn.close()

def get_history(limit=50):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM translation_history ORDER BY timestamp DESC LIMIT ?', (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def clear_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM translation_history')
    conn.commit()
    conn.close()

def get_analytics():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) as total_translations FROM translation_history')
    total_translations = cursor.fetchone()['total_translations']
    
    cursor.execute('''
        SELECT target_language, COUNT(target_language) as count
        FROM translation_history 
        GROUP BY target_language 
        ORDER BY count DESC LIMIT 1
    ''')
    most_used_row = cursor.fetchone()
    most_used_language = most_used_row['target_language'] if most_used_row else "N/A"
    
    cursor.execute('SELECT AVG(translation_length) as avg_length FROM translation_history')
    avg_length_row = cursor.fetchone()
    avg_length = round(avg_length_row['avg_length'], 2) if avg_length_row and avg_length_row['avg_length'] else 0
    
    cursor.execute('SELECT SUM(translation_length) as total_chars FROM translation_history')
    total_chars_row = cursor.fetchone()
    total_chars = total_chars_row['total_chars'] if total_chars_row and total_chars_row['total_chars'] else 0
    
    cursor.execute("SELECT COUNT(*) as today_count FROM translation_history WHERE date(timestamp) = date('now')")
    today_count = cursor.fetchone()['today_count']
    
    conn.close()
    
    return {
        "total_translations": total_translations,
        "most_used_target_language": most_used_language,
        "average_text_length": avg_length,
        "total_characters_processed": total_chars,
        "today_translation_count": today_count
    }
