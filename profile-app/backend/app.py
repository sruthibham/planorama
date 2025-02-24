from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    profile_photo = db.Column(db.String(200), nullable=True)
    badges = db.Column(db.PickleType, default=[])

@app.route('/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    user = User.query.get(user_id)
    if user:
        return jsonify({"username": user.username, "profile_photo": user.profile_photo, "badges": user.badges})
    return jsonify({"error": "User not found"}), 404

if __name__ == '__main__':
    db.create_all()
    app.run(debug=True)
