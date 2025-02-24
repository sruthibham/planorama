from flask import Blueprint, jsonify
from models import User, db

profile_bp = Blueprint("profile", __name__)

@profile_bp.route("/profile/<int:user_id>", methods=["GET"])
def get_profile(user_id):
    user = User.query.get(user_id)
    if user:
        return jsonify(user.to_dict()), 200
    return jsonify({"error": "User not found"}), 404
