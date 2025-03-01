import os
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import sqlite3

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/profile_pics'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    conn = sqlite3.connect('tasks.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/upload_profile_picture', methods=['POST'])
def upload_profile_picture():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(filepath):
            return jsonify({'error': 'File already exists'}), 400
        if file.content_length > MAX_FILE_SIZE:
            return jsonify({'error': 'File size exceeds 10MB limit'}), 400
        file.save(filepath)
        conn = get_db_connection()
        conn.execute("UPDATE users SET profile_picture = ? WHERE id = ?", (filename, 1))  # Example user ID = 1
        conn.commit()
        conn.close()
        return jsonify({'message': 'Profile picture updated', 'filename': filename})
    return jsonify({'error': 'Invalid file format'}), 400

@app.route('/get_profile', methods=['GET'])
def get_profile():
    conn = get_db_connection()
    user = conn.execute("SELECT username, profile_picture, achievements FROM users WHERE id = 1").fetchone()
    conn.close()
    if user:
        return jsonify({
            'username': user['username'],
            'profile_picture': user['profile_picture'],
            'achievements': user['achievements']
        })
    return jsonify({'error': 'User not found'}), 404

@app.route('/profile_pics/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True)
