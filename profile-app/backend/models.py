from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    profile_photo = db.Column(db.String(255), nullable=True)  # URL or path to image
    badges = db.Column(db.Text, nullable=True)  # Store as JSON string

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "profile_photo": self.profile_photo,
            "badges": self.badges.split(",") if self.badges else []
        }
