from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

'''
Create account:
 - Insert the data into hash table
'''
@app.route("/createuser", methods=["POST"])
def create_acc():
    data = request.json  # Get JSON data sent from Axios
    return jsonify({"create acc received": data})



# Log in
'''
Log in:
 - Check if data exists in 
'''
@app.route("/loguser", methods=["POST"])
def log_in():
    data = request.json  # Get JSON data sent from Axios
    return jsonify({"login received": data})




if __name__ == "__main__":
    app.run(debug=True)