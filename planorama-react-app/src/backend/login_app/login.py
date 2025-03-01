from flask import Flask, request, jsonify
from flask_cors import CORS
import re # Regex for password checking

app = Flask(__name__)
CORS(app)

# Dict (hash table) containing user's credentials
# Key = username , Value = (email, password)
user_info={}

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
    if ("@" not in email or "." not in email):
        validEmail=0
        errors.append("Use a valid email")

    # Check if email already in use
    for u, ep in user_info.items():
        if (ep[0] == email):
            errors.append("Email already in use\n")
            validEmail=0
            break

    # Check if password is sufficiently strong
    validPass=1
    if (not (len(password) < 32 and len(password) > 8)):
        errors.append("Password too short")
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
    if (username not in user_info):
        if (validEmail==1 and validPass==1):
            # Successfully create user
            user_info[username] = (email, password)
            response=["Added user: " + username + ", " + user_info[username][0] + ", " + user_info[username][1]]
            return jsonify(response)
    else:
        errors.append("Username taken")
    return jsonify(errors)





# Log in
'''
Log in:
 - Check if username and password correct in hash table
 - Fetch your data from database
 - Update your pages based on your data
'''
@app.route("/loguser", methods=["POST"])
def log_in():
    data = request.json  # Get JSON data sent from Axios



    return jsonify({"login received": data})

'''
Delete account:
 - Delete credentials from hash table using username
 - Delete database entry using username
'''
@app.route("/deleteuser", methods=["POST"])
def delete_acc():
    data = request.json
    return jsonify({"delete received": data})



if __name__ == "__main__":
    app.run(debug=True)