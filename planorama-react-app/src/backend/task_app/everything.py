from datetime import datetime
import os
import re # Regex for password checking
from werkzeug.utils import secure_filename
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import json
import threading
import time

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
    start_date = db.Column(db.String(50), nullable=True)  # New Field
    time_logs = db.Column(db.Text, default="[]", nullable=True)

    def get_subtasks(self):
        try:
            return json.loads(self.subtasks) if self.subtasks else []
        except json.JSONDecodeError:
            return []

    def set_subtasks(self, subtasks_list):
        self.subtasks = json.dumps(subtasks_list)

    def get_time_logs(self):
        try:
            return json.loads(self.time_logs) if self.time_logs else []
        except json.JSONDecodeError:
            return []

    def set_time_logs(self, logs_list):
        self.time_logs = json.dumps(logs_list)

    def get_total_time_spent(self):
        return sum(entry.get("minutes", 0) for entry in self.get_time_logs())


with app.app_context():
    db.create_all()

@app.route("/tasks", methods=["GET"])
def get_tasks():
    global currentUser
    tasks = Task.query.filter(Task.user == currentUser, 
                              (Task.start_date == None) | (Task.start_date <= datetime.today().strftime("%Y-%m-%d"))).all()
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
        "start_date": task.start_date,
        "time_logs": task.get_time_logs(),
        "subtasks": task.get_subtasks()
    } for task in tasks])

# Retrieve SCHEDULED tasks
@app.route("/scheduled_tasks", methods=["GET"])
def get_scheduled_tasks():
    global currentUser
    tasks = Task.query.filter(Task.user == currentUser, Task.start_date > datetime.today().strftime("%Y-%m-%d")).all()

    return jsonify([{
        "id": task.id,
        "name": task.name,
        "description": task.description,
        "due_time": task.due_time,
        "priority": task.priority,
        "color_tag": task.color_tag,
        "status": task.status,
        "start_date": task.start_date,
        "time_logs": task.get_time_logs(),
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
    
    start_date = data.get("start_date")
    if start_date:
        try:
            start_date_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
            if start_date_dt < datetime.today().date():
                return jsonify({"error": "Start date cannot be in the past."}), 400
        except ValueError:
            return jsonify({"error": "Start date format invalid."}), 400

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
        status=data.get("status", "To-Do"),
        start_date=start_date
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
        "start_date": new_task.start_date,
        "time_logs": new_task.get_time_logs(), 
        "subtasks": new_task.get_subtasks()
    }}), 201

# Move scheduled tasks to active at midnight
def auto_move_tasks():
    while True:
        with app.app_context():
            today = datetime.today().strftime("%Y-%m-%d")
            tasks = Task.query.filter(Task.start_date == today).all()
            for task in tasks:
                task.start_date = None  # Move to active
            db.session.commit()
        time.sleep(86400)  # Run every 24 hours
# Start the background thread
threading.Thread(target=auto_move_tasks, daemon=True).start()

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
    
    start_date = data.get("start_date")
    if start_date:
        try:
            start_date_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
            if start_date_dt < datetime.today().date():
                return jsonify({"error": "Start date cannot be in the past."}), 400
        except ValueError:
            return jsonify({"error": "Start date format invalid."}), 400


    # update
    task.name = data.get("name", task.name)
    task.description = data.get("description", task.description)
    task.due_time = data.get("due_time", task.due_time)
    task.priority = data.get("priority", task.priority)
    task.color_tag = data.get("color_tag", task.color_tag)
    task.status = data.get("status", task.status)
    if "time_logs" in data:
        task.set_time_logs(data["time_logs"])
    task.start_date = start_date

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
            "start_date": task.start_date,
            "time_logs": task.get_time_logs(), 
            "subtasks": task.get_subtasks()
        }
    }), 200
# Start task immediately (move to active)
@app.route("/tasks/<int:task_id>/start_now", methods=["PUT"])
def start_task_now(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    task.start_date = None 
    db.session.commit()

    return jsonify({"message": "Task started immediately!"}), 200

@app.route("/tasks/<int:task_id>/log_time", methods=["POST"])
def log_time(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.json
    try:
        minutes = int(data.get("minutes", 0))
    except ValueError:
        return jsonify({"error": "Time must be a number."}), 400

    if minutes <= 0 or minutes > 1440:
        return jsonify({"error": "Time must be between 1 and 1440 minutes."}), 400

    logs = task.get_time_logs()
    new_entry = {
        "id": len(logs) + 1,
        "minutes": minutes,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    logs.append(new_entry)
    task.set_time_logs(logs)
    db.session.commit()
    return jsonify({"message": "Time logged.", "logs": logs, "total": task.get_total_time_spent()})

@app.route("/tasks/<int:task_id>/log_time/<int:log_id>", methods=["PUT"])
def edit_log_time(task_id, log_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    data = request.json
    try:
        minutes = int(data.get("minutes", 0))
    except ValueError:
        return jsonify({"error": "Time must be a number."}), 400

    if minutes <= 0 or minutes > 1440:
        return jsonify({"error": "Time must be between 1 and 1440 minutes."}), 400

    logs = task.get_time_logs()
    for log in logs:
        if log["id"] == log_id:
            log["minutes"] = minutes
            break
    else:
        return jsonify({"error": "Log entry not found"}), 404

    task.set_time_logs(logs)
    db.session.commit()
    return jsonify({"message": "Log updated.", "logs": logs, "total": task.get_total_time_spent()})

@app.route("/tasks/<int:task_id>/log_time/<int:log_id>", methods=["DELETE"])
def delete_log_time(task_id, log_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    logs = task.get_time_logs()
    logs = [log for log in logs if log["id"] != log_id]

    task.set_time_logs(logs)
    db.session.commit()
    return jsonify({"message": "Log deleted.", "logs": logs, "total": task.get_total_time_spent()})

@app.route("/time_summary", methods=["GET"])
def time_summary():
    global currentUser
    tasks = Task.query.filter_by(user=currentUser).all()
    total = sum(task.get_total_time_spent() for task in tasks)
    return jsonify({"total_time_spent": total})



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


# TEAMS ------------------------------------------------
class Teams(db.Model):
    teamID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    teamName = db.Column(db.String(64), nullable=False)
    owner = db.Column(db.String(64), nullable=False)
    members = db.Column(db.Text, nullable=True)

    def get_members(self):
        return json.loads(self.members) if self.members else []

    def add_member(self, username):
        members = self.get_members()
        if username not in members:
            members.append(username)
            self.members = json.dumps(members)
            db.session.commit()

with app.app_context():
    db.create_all()

# Create a team based on a name, with only member being the creator
@app.route("/createteam", methods=["POST"])
def createTeam():
    data = request.json
    new_team = Teams(
        teamName=data.get("teamName"), 
        owner=currentUser, 
        members=json.dumps([currentUser])
    )
    
    db.session.add(new_team)
    db.session.commit()
    return jsonify(data)

# Get all teams for a certain user
@app.route("/getteams", methods=["GET"])
def getTeams():
    global currentUser
    teams = Teams.query.all()
    user_teams = [team for team in teams if currentUser in team.get_members()]

    return jsonify([{
        "teamID": team.teamID,
        "teamName": team.teamName,
        "owner": team.owner,
        "members": team.get_members()
    } for team in user_teams])

# Get the information of a team based on ID
@app.route("/getteam", methods=["GET"])
def getTeamFromID():
    teamID = request.args.get("teamID")
    team = Teams.query.get(teamID)

    return jsonify({
        "teamID": team.teamID,
        "teamName": team.teamName,
        "owner": team.owner,
        "members": team.get_members()
    })

# Delete a team from database
@app.route("/deleteteam", methods=["POST"])
def delTeam():
    data = request.json
    team = Teams.query.get(data["teamID"])
    db.session.delete(team)
    db.session.commit()
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)