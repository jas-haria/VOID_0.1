from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException


app = Flask(__name__)



@app.errorhandler(Exception)
def handle_error(e):
    code = 500
    if isinstance(e, HTTPException):
        code = e.code
    return jsonify(error=str(e)), code
