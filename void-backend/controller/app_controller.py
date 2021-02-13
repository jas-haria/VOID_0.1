from flask import Flask, jsonify, Response, json

from authentication.authenticator import AuthError
import config

app = Flask(__name__)

@app.errorhandler(AuthError)
def handle_auth_error(ex):
    response = jsonify(ex.error)
    response.status_code = ex.status_code
    return response

@app.route(config.base_api + '/test', methods=['GET'])
def test():
    return Response(json.dumps({'Hello': 'world'}), status=200, mimetype='application/json')
