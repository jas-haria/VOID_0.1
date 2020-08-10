from sqlalchemy import asc

from model.model import Division
from service.util_service import get_new_session, convert_list_to_json

def getAllDivisions():
    session = get_new_session()
    return convert_list_to_json(session.query(Division).order_by(asc(Division.id)))