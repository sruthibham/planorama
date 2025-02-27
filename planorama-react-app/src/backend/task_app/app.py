from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tasks.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

PRIORITY_OPTIONS = ["Low", "Medium", "High"]
STATUS_OPTIONS = ["To-Do", "In Progress", "Completed"]

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_time = db.Column(db.String(50), nullable=False)
    priority = db.Column(db.String(20), nullable=False)
    color_tag = db.Column(db.String(20), nullable=True)
    status = db.Column(db.String(20), default="To-Do")

with app.app_context():
    db.create_all()

@app.route("/tasks", methods=["GET"])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([{
        "id": task.id,
        "name": task.name,
        "description": task.description,
        "due_time": task.due_time,
        "priority": task.priority,
        "color_tag": task.color_tag,
        "status": task.status
    } for task in tasks])

@app.route("/tasks", methods=["POST"])
def add_task():
    data = request.json

    try:
        due_date = datetime.strptime(data["due_time"], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Deadline is required"}), 400
    
    if not data.get("name"):
        return jsonify({"error": "Task name is required"}), 400
    if not data.get("due_time"):
        return jsonify({"error": "Deadline is required"}), 400

    if data["priority"] not in PRIORITY_OPTIONS:
        return jsonify({"error": f"Invalid priority. Must be one of {PRIORITY_OPTIONS}"}), 400
    if data["status"] not in STATUS_OPTIONS:
        return jsonify({"error": f"Invalid status. Must be one of {STATUS_OPTIONS}"}), 400

    existing_task = Task.query.filter_by(name=data["name"], due_time=str(due_date)).first()
    if existing_task:
        warning = "Duplicate task detected, but added successfully."
    else:
        warning = None

    new_task = Task(
        name=data["name"],
        description=data.get("description"),
        due_time=data["due_time"],
        priority=data["priority"],
        color_tag=data.get("color_tag"),
        status=data.get("status", "To-Do")
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify({"message": "Task added successfully!", "warning": warning, task": {
        "id": new_task.id,
        "name": new_task.name,
        "description": new_task.description,
        "due_time": new_task.due_time,
        "priority": new_task.priority,
        "color_tag": new_task.color_tag,
        "status": new_task.status
    }}), 201

@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)  # Remove task from database
    db.session.commit()  # Save changes
    return jsonify({"message": "Task deleted successfully"}), 200

if __name__ == "__main__":
    app.run(debug=True)
