from flask_cors import CORS

from controller import app_controller
from scheduler import scheduler

app = app_controller.app
CORS(app)

#IMPORTING ROUTES
from controller import app_controller, quora_controller, division_controller

#IMPORTING SCHEDULER
scheduler.scheduler.start()

if __name__ == '__main__':
    app.run(threaded=True)