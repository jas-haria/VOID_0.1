from flask_cors import CORS

from controller import app_controller

app = app_controller.app
CORS(app)

#IMPORTING ROUTES
from controller import quora_controller, division_controller


if __name__ == '__main__':
    app.run()