from sqlalchemy import asc

from model.quora_model import Division
from service.util_service import get_new_session, convert_list_to_json

def getAllDivisions():
    session = get_new_session()
    divisions = session.query(Division).order_by(asc(Division.id))
    response = convert_list_to_json(divisions)
    session.close()
    return response