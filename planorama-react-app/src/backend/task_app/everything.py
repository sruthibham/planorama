from datetime import datetime
import os
import re # Regex for password checking
from werkzeug.utils import secure_filename
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import json


app = Flask(__name__)
CORS(app)

# Update current user whenever refreshed
path = os.path.join(os.path.dirname(os.path.abspath(__file__)),"currentUser.txt")
word = open(path).read()
if word == "" :
    currentUser="Guest"
    open(path, "w+").write(currentUser)
else:
    currentUser=word
    open(path, "w+").write(currentUser)



# APP.PY (tasks) --------------------------

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),"tasks.db")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

PRIORITY_OPTIONS = ["Low", "Medium", "High"]
STATUS_OPTIONS = ["To-Do", "In Progress", "Completed"]

class Task(db.Model):
    user = db.Column(db.String(32), nullable=False)
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_time = db.Column(db.String(50), nullable=False)
    priority = db.Column(db.String(20), nullable=False)
    color_tag = db.Column(db.String(20), nullable=True)
    status = db.Column(db.String(20), default="To-Do")
    subtasks = db.Column(db.Text, default="[]", nullable=True)

    def get_subtasks(self):
        try:
            return json.loads(self.subtasks) if self.subtasks else []
        except json.JSONDecodeError:
            return []

    def set_subtasks(self, subtasks_list):
        self.subtasks = json.dumps(subtasks_list)

with app.app_context():
    db.create_all()

@app.route("/tasks", methods=["GET"])
def get_tasks():
    global currentUser
    tasks = Task.query.filter_by(user=currentUser).all()
    usersTasks = []
    # for task in tasks:
    #     if (task.user == currentUser):
    #         usersTasks.append(task)
    return jsonify([{
        "username": currentUser,
        "id": task.id,
        "name": task.name,
        "description": task.description,
        "due_time": task.due_time,
        "priority": task.priority,
        "color_tag": task.color_tag,
        "status": task.status,
        "subtasks": task.get_subtasks()
    } for task in tasks])

@app.route("/tasks", methods=["POST"])
def add_task():
    data = request.json

    if not data.get("name"):
        return jsonify({"error": "Task name is required"}), 400
    if not data.get("due_time"):
        return jsonify({"error": "Deadline is required"}), 400
    
    try:
        due_date = datetime.strptime(data["due_time"], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Deadline is required"}), 400

    if data["priority"] not in PRIORITY_OPTIONS:
        return jsonify({"error": f"Invalid priority. Must be one of {PRIORITY_OPTIONS}"}), 400
    if data["status"] not in STATUS_OPTIONS:
        return jsonify({"error": f"Invalid status. Must be one of {STATUS_OPTIONS}"}), 400

    existing_task = Task.query.filter_by(user=data["username"], name=data["name"], due_time=str(due_date)).first()
    if existing_task:
        warning = "Duplicate task detected, but added successfully."
    else:
        warning = None

    subtasks = data.get("subtasks", [])

    new_task = Task(
        user=data["username"],
        name=data["name"],
        description=data.get("description"),
        due_time=data["due_time"],
        priority=data["priority"],
        color_tag=data.get("color_tag"),
        status=data.get("status", "To-Do")
    )
    new_task.set_subtasks(subtasks)

    db.session.add(new_task)
    db.session.commit()

    return jsonify({"message": "Task added successfully!", "warning": warning, "task": {
        "id": new_task.id,
        "name": new_task.name,
        "description": new_task.description,
        "due_time": new_task.due_time,
        "priority": new_task.priority,
        "color_tag": new_task.color_tag,
        "status": new_task.status,
        "subtasks": new_task.get_subtasks()
    }}), 201

@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)  # Remove task from database
    db.session.commit()  # Save changes
    return jsonify({"message": "Task deleted successfully"}), 200

@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.json
    username = data.get("username")

    # task belongs to the user making the request
    task = Task.query.filter_by(id=task_id, user=username).first()

    if not data.get("name"):
        return jsonify({"error": "Task name is required."}), 400
    if not data.get("due_time"):
        return jsonify({"error": "Due date is required."}), 400

    if not task:
        return jsonify({"error": "Task not found or you don't have permission to edit this task"}), 403

    # update
    task.name = data.get("name", task.name)
    task.description = data.get("description", task.description)
    task.due_time = data.get("due_time", task.due_time)
    task.priority = data.get("priority", task.priority)
    task.color_tag = data.get("color_tag", task.color_tag)
    task.status = data.get("status", task.status)

    if "subtasks" in data:
        task.set_subtasks(data["subtasks"])

    db.session.commit()

    return jsonify({
        "message": "Task updated successfully!",
        "task": {
            "id": task.id,
            "user": task.user,
            "name": task.name,
            "description": task.description,
            "due_time": task.due_time,
            "priority": task.priority,
            "color_tag": task.color_tag,
            "status": task.status,
            "subtasks": task.get_subtasks()
        }
    }), 200


# LOGIN.PY ------------------------------------

# Database containing user's credentials

class UserLogin(db.Model):
    username = db.Column(db.String(64), primary_key=True)
    email = db.Column(db.String(64), nullable=False)
    pwd = db.Column(db.String(64), nullable=False)

with app.app_context():
    db.create_all()


#Login for quick testing
with app.app_context():
    if not UserLogin.query.filter_by(username="admin").first():
        admin = UserLogin(username="admin", email="email", pwd="pass")
        db.session.add(admin)
        db.session.commit()


'''
Create account:
 - Insert the username, email, pass into hash table (if username and email unique)
 - Create empty database entry tied to your username
'''
@app.route("/createuser", methods=["POST"])
def create_acc():
    data = request.json  # Get JSON data sent from Axios

    username=data.get("username")
    email=data.get("email")
    password=data.get("password")

    errors=[]
    validEmail=1
    # Check if email is valid
    if ("@" not in email or "." not in email or len(email) < 5):
        validEmail=0
        errors.append("Use a valid email")

    # Check if email already in use
    if UserLogin.query.filter_by(email=email).first():
        errors.append("Email already in use")
        validEmail=0

    # Check if password is sufficiently strong
    validPass=1
    if (not (len(password) < 32 and len(password) >= 8)):
        errors.append("Password must be between 8 and 32 characters")
        validPass=0
    if (not (re.search(r"[A-Z]", password) and re.search(r"[a-z]", password))):
        errors.append("Password requires at least one uppercase and lowercase letter")
        validPass=0
    if (not re.search(r"\d", password)):
        errors.append("Password requires at least one number")
        validPass=0
    if (not re.search(r"[!@#$%^&*?]", password)):
        errors.append("Password requires at least one special character (!@#$%^&*)")
        validPass=0
            
    # Check if username is already in use
    validUser=1
    if (len(username) < 4):
        errors.append("Username too short")
        validUser=0
    if (len(username) > 32):
        errors.append("Username too long")
        validUser=0
    if (username=="Guest"):
        errors.append("Username cannot be \"Guest\"")
        validUser=0
    if not UserLogin.query.filter_by(username=username).first():
        if (validEmail==1 and validPass==1 and validUser==1):
            # Successfully create user
            db.session.add(UserLogin(username=username, email=email, pwd=password))
            db.session.commit()
            response=["Account created!"]
            global currentUser
            currentUser=username
            open(path, "w+").write(currentUser)
            return jsonify({"success": True, "msg": response})


    else:
        errors.append("Username taken")
    return jsonify({"success": False, "msg": errors})


# Log in
'''
Log in:
 - Check if username and password correct in hash table
 - Fetch your data from database
 - Update your pages based on your data
'''
@app.route("/loguser", methods=["POST"])
def log_in():
    data = request.json
    username=data.get("username")
    password=data.get("password")

    user = UserLogin.query.filter_by(username=username).first()

    # Check if login is correct
    if user and user.pwd == password:
        global currentUser
        currentUser=username
        open(path, "w+").write(currentUser)
        return jsonify({"success": True, "msg": "Logged in!"})
    else:
        return jsonify({"success": False, "msg": "Incorrect username or password."})


'''
Delete account:
 - Delete credentials from hash table using username
 - Delete database entry using username
'''
@app.route("/deleteuser", methods=["POST"])
def delete_acc():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    user = UserLogin.query.filter_by(username=username).first()

    if user and user.pwd == password:
        db.session.delete(user)
        Task.query.filter_by(user=username).delete()
        db.session.commit()
        global currentUser
        currentUser="Guest"
        open(path, "w+").write(currentUser)
        return jsonify({"success": True, "msg": "User deleted"})
    else:
        return jsonify({"success": False, "msg": "Incorrect password"})

'''
Log out:
 - Set username to "Guest"
'''
@app.route("/logout", methods=["GET"])
def log_out():
    global currentUser
    currentUser="Guest"
    open(path, "w+").write(currentUser)
    return jsonify(currentUser)

'''
Update:
Used to stay logged in when refreshing
'''
@app.route("/update-user", methods=["GET"])
def updateUser():
    global currentUser
    currentUser = open(path).read()
    return jsonify(currentUser)


# PROFILE.PY ---------------------

app.config['UPLOAD_FOLDER'] = 'static/profile_pics'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
UPLOAD_FOLDER = app.config['UPLOAD_FOLDER']

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    profile_picture = db.Column(db.String(100), nullable=True)
    achievements = db.Column(db.String(255), nullable=True)

    def __repr__(self):
        return f"<User {self.username}>"
    
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    conn = sqlite3.connect('tasks.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/upload_profile_picture', methods=['POST'])
def upload_profile_picture():
    user_id = request.form.get('user_id')  # Get the user_id from the request
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        if file.content_length > app.config['MAX_FILE_SIZE']:
            return jsonify({'error': 'File size exceeds 10MB limit'}), 400

        file.save(filepath)

        # Update the user's profile picture in the database
        user = User.query.get(user_id)
        if user:
            user.profile_picture = filename
            db.session.commit()
            return jsonify({'message': 'Profile picture updated successfully!', 'filename': filename})
        else:
            return jsonify({'error': 'User not found'}), 404
    else:
        return jsonify({'error': 'Invalid file format'}), 400

@app.route('/get_profile', methods=['GET'])
def get_profile():
    user_id = request.args.get('user_id')  # Get the user_id from the query parameter
    user = User.query.get(user_id)
    if user:
        return jsonify({
            'username': user.username,
            'profile_picture': user.profile_picture,
            'achievements': user.achievements or 'No achievements yet'
        })
    return jsonify({'error': 'User not found'}), 404

@app.route('/profile_pics/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/update_profile', methods=['POST'])
def update_profile():
    data = request.json
    user_id = data['user_id']
    new_username = data['username']

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()

    if user:
        conn.execute('UPDATE users SET username = ? WHERE id = ?', (new_username, user_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Profile updated successfully'})
    else:
        return jsonify({'error': 'User not found'}), 404

# SETTINGS.PY ------------------------------------

class UserSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, unique=True, nullable=False)  # Unique settings per user
    dark_mode = db.Column(db.Boolean, default=False)
    theme = db.Column(db.String(20), default="light")
    text_size = db.Column(db.String(10), default="medium")
    text_font = db.Column(db.String(50), default="Arial")  # Added text font
    text_spacing = db.Column(db.String(10), default="None")  # Added text spacing

with app.app_context():
    db.create_all()

@app.route("/get_settings/<int:user_id>", methods=["GET"])
def get_settings(user_id):
    settings = UserSettings.query.filter_by(user_id=user_id).first()
    if settings:
        return jsonify({
            "dark_mode": settings.dark_mode,
            "theme": settings.theme,
            "text_size": settings.text_size,
            "text_font": settings.text_font,  
            "text_spacing": settings.text_spacing  
        })
    else:
        return jsonify({"error": "Settings not found"}), 404

@app.route("/update_settings/<int:user_id>", methods=["POST"])
def update_settings(user_id):
    data = request.json
    settings = UserSettings.query.filter_by(user_id=user_id).first()

    if settings:
        settings.dark_mode = data.get("dark_mode", settings.dark_mode)
        settings.theme = data.get("theme", settings.theme)
        settings.text_size = data.get("text_size", settings.text_size)
        settings.text_font = data.get("text_font", settings.text_font)
        settings.text_spacing = data.get("text_spacing", settings.text_spacing) 
    else:
        settings = UserSettings(
            user_id=user_id,
            dark_mode=data.get("dark_mode", False),
            theme=data.get("theme", "light"),
            text_size=data.get("text_size", "medium"),
            text_font=data.get("text_font", "Arial"),
            text_spacing=data.get("text_spacing", "None") 
        )
        db.session.add(settings)

    db.session.commit()
    return jsonify({"message": "Settings updated successfully"}), 200


if __name__ == "__main__":
    app.run(debug=True)
