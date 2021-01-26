from flask import Response
import json

from authentication.authenticator import requires_auth
from controller import app_controller
from service import division_service

app = app_controller.app

base_url = '/division'

@app.route(base_url, methods=['GET'])
@requires_auth
def getAllDivisions():
    return Response(json.dumps(division_service.getAllDivisions()), status=200, mimetype='application/json')