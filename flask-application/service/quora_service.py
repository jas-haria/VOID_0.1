from sqlalchemy import asc, desc, func, and_

import io
import pandas

from model.quora_model import Division, QuoraQuestion, Script, QuoraAccount, ExecutionLog, QuoraKeyword, \
    QuoraQuestionsArchieve, \
    QuoraQuestionAccountDetails, QuoraQuestionAccountActions, QuoraAccountStats, \
    QuoraQuestionArchieveAccountDetails, QuoraAskedQuestionArchieveStats
from model.enum import TimePeriod, QuoraQuestionAccountAction
from service.util_service import get_new_session, paginate, convert_list_to_json, get_time_interval, convert_question_count_array_to_json
import config

quora_asked_question_excel_headers = ['Question Url', 'Question Text', 'Division', 'Account', 'Asked On']


def disregard_questions(question_ids_list):
    session = get_new_session()
    questions = session.query(QuoraQuestion).filter(QuoraQuestion.id.in_(question_ids_list)).all()
    for question in questions:
        question.disregard = True
        session.add(question)
    session.commit()
    session.close()
    return {}

def update_qqad(question_ids_list, action, account_id):
    session = get_new_session()
    questions = session.query(QuoraQuestion).filter(QuoraQuestion.id.in_(question_ids_list)).all()
    action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction[action]).first()
    if action_object is not None:
        for question in questions:
            persisted_qqad = session.query(QuoraQuestionAccountDetails).filter(and_(
                QuoraQuestionAccountDetails.action_id == action_object.id,
                QuoraQuestionAccountDetails.question_id == question.id,
                QuoraQuestionAccountDetails.account_id == account_id)).first()
            if persisted_qqad is None:
                qqad = QuoraQuestionAccountDetails()
                qqad.question_id = question.id
                qqad.account_id = account_id
                qqad.action = action_object
                session.add(qqad)
    session.commit()
    session.close()
    return {}

def delete_qqad(question_ids_list, action, account_id):
    session = get_new_session()
    action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction[action]).first()
    session.query(QuoraQuestionAccountDetails).filter(and_(
        QuoraQuestionAccountDetails.question_id.in_(question_ids_list),
        QuoraQuestionAccountDetails.account_id == account_id,
        QuoraQuestionAccountDetails.action_id == action_object.id)).delete(synchronize_session=False)
    session.commit()
    session.close()
    return {}

def add_pass_qqad(question_ids_list, account_id):
    if account_id is not None:
        update_qqad(question_ids_list, QuoraQuestionAccountAction.PASSED.__str__(), account_id)
    else:
        session = get_new_session()
        passed_action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.PASSED).first()
        requested_action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.REQUESTED).first()
        requested_qqads = session.query(QuoraQuestionAccountDetails).filter(and_(
            QuoraQuestionAccountDetails.question_id.in_(question_ids_list),
            QuoraQuestionAccountDetails.action_id == requested_action_object.id)).all()
        for requested_qqad in requested_qqads:
            persisted_qqad = session.query(QuoraQuestionAccountDetails).filter(and_(
                QuoraQuestionAccountDetails.action_id == passed_action_object.id,
                QuoraQuestionAccountDetails.question_id == requested_qqad.question_id,
                QuoraQuestionAccountDetails.account_id == requested_qqad.account_id)).first()
            if persisted_qqad is None:
                qqad = QuoraQuestionAccountDetails()
                qqad.question_id = requested_qqad.question_id
                qqad.account_id = requested_qqad.account_id
                qqad.action = passed_action_object
                session.add(qqad)
        session.commit()
        session.close()
    return {}

def get_questions(division_ids, time, page_number, page_size, action, account_id):
    session = get_new_session()
    if action == QuoraQuestionAccountAction.NEW.__str__():
        query = session.query(QuoraQuestion).filter(and_(QuoraQuestion.division_id.in_(division_ids)),
                                                    QuoraQuestion.asked_on > get_time_interval(time, 1),
                                                    (QuoraQuestion.disregard).is_(False),
                                                    ~QuoraQuestion.accounts.any()).order_by(desc(QuoraQuestion.id))
        length, paginated_query = paginate(query=query, page_number=int(page_number), page_limit=int(page_size))
        result = paginated_query.all()
        session.close()
        return {'totalLength': length, 'content': convert_list_to_json(result)}
    if action == QuoraQuestionAccountAction.REQUESTED.__str__():
        actions_to_ignore = [QuoraQuestionAccountAction.ASSIGNED, QuoraQuestionAccountAction.ANSWERED, QuoraQuestionAccountAction.EVALUATED, QuoraQuestionAccountAction.PASSED]
    elif action == QuoraQuestionAccountAction.ASSIGNED.__str__():
        actions_to_ignore = [QuoraQuestionAccountAction.ANSWERED, QuoraQuestionAccountAction.EVALUATED, QuoraQuestionAccountAction.PASSED]
    elif action == QuoraQuestionAccountAction.ANSWERED.__str__():
        actions_to_ignore = [QuoraQuestionAccountAction.EVALUATED, QuoraQuestionAccountAction.PASSED]
    else:
        actions_to_ignore = None
    query = session.query(QuoraQuestionAccountDetails.question_id).join(QuoraQuestion).join(
        QuoraQuestionAccountActions)
    if actions_to_ignore is not None:
        questions_to_ignore = session.query(QuoraQuestionAccountDetails.question_id).join(QuoraQuestionAccountActions).filter(
            QuoraQuestionAccountActions.action.in_(actions_to_ignore))
        if account_id is not None:
            questions_to_ignore = questions_to_ignore.filter(QuoraQuestionAccountDetails.account_id == account_id)
        questions_to_ignore = questions_to_ignore.subquery()
        query = query.filter(QuoraQuestion.id.notin_(questions_to_ignore))
    query = query.filter(and_(
        QuoraQuestion.division_id.in_(division_ids),
        QuoraQuestion.asked_on > get_time_interval(time, 1),
        (QuoraQuestion.disregard).is_(False),
        QuoraQuestionAccountActions.action == action))
    if account_id is not None:
        query = query.filter(QuoraQuestionAccountDetails.account_id == account_id)
    length, paginated_query = paginate(query=query.order_by(desc(QuoraQuestion.id)), page_number=int(page_number), page_limit=int(page_size))
    question_ids = paginated_query.all()
    questions = session.query(QuoraQuestion).filter(QuoraQuestion.id.in_(question_ids)).all()
    response = {'totalLength': length, 'content': convert_list_to_json(questions)}
    session.close()
    return response

def get_asked_questions_archieve_stats(question_ids, last_week):
    session = get_new_session()
    stats = []
    if question_ids is None:
        question_urls = session.query(QuoraQuestion.question_url).filter(QuoraQuestion.asked_on > get_time_interval(TimePeriod.MONTH.value, 1)).all()
    else:
        question_urls = session.query(QuoraQuestion.question_url).filter(QuoraQuestion.id.in_(question_ids)).all()
    archieve_question_ids = session.query(QuoraQuestionsArchieve.id).filter(QuoraQuestionsArchieve.question_url.in_(question_urls)).all()
    query = session.query(QuoraAskedQuestionArchieveStats)
    if last_week is True:
        query = query.filter(QuoraAskedQuestionArchieveStats.recorded_on < get_time_interval(TimePeriod.WEEK.value, 1))
    for id in archieve_question_ids:
        question_stat = query.filter(QuoraAskedQuestionArchieveStats.question_id == id).order_by(desc(QuoraAskedQuestionArchieveStats.recorded_on)).first()
        stats.append(question_stat)
    response = convert_list_to_json(stats)
    session.close()
    return response

def generate_pending_questions_df_for_excel(account_id):
    session = get_new_session()
    data = []
    questions_to_ignore = session.query(QuoraQuestionAccountDetails.question_id).join(QuoraQuestionAccountActions).filter(
        QuoraQuestionAccountActions.action.in_([QuoraQuestionAccountAction.ANSWERED, QuoraQuestionAccountAction.EVALUATED])).all()
    question_ids = session.query(QuoraQuestionAccountDetails.question_id).join(QuoraQuestion).join(QuoraQuestionAccountActions).filter((QuoraQuestion.disregard).is_(False))\
        .filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.ASSIGNED).filter(QuoraQuestionAccountDetails.question_id.notin_(questions_to_ignore))\
        .filter(QuoraQuestionAccountDetails.account_id == account_id).all()
    questions = session.query(QuoraQuestion).filter(QuoraQuestion.id.in_(question_ids)).order_by(desc(QuoraQuestion.id))
    for question in questions:
        data.append({'id': question.id, 'question': question.question_text, 'url': question.question_url, 'division': question.division.division, 'approx date asked': question.asked_on})
    dataframe = pandas.DataFrame(data)
    strIO = io.BytesIO()
    excel_writer = pandas.ExcelWriter(strIO, engine="xlsxwriter")
    dataframe.to_excel(excel_writer, sheet_name="sheet 1")
    excel_writer.save()
    strIO.seek(0)
    return strIO

def get_accounts(id):
    session = get_new_session()
    if id is None:
        accounts = session.query(QuoraAccount).order_by(asc(QuoraAccount.id)).all()
        response = convert_list_to_json(accounts)
    else:
        account = session.query(QuoraAccount).filter(QuoraAccount.id == id).first()
        response = account._asdict()
    session.close()
    return response

def get_quora_accounts_stats(account_id):
    session = get_new_session()
    query = session.query(QuoraAccountStats)
    if account_id is not None:
        query = query.filter(QuoraAccountStats.account_id == account_id)
    stats = query.filter(QuoraAccountStats.recorded_on > get_time_interval(TimePeriod.MONTH.value, 1)).all()
    response = convert_list_to_json(stats)
    session.close()
    return response

def get_quora_questions_count(action, account_id):
    session = get_new_session()
    action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction[action]).first()
    query = session.query(func.count(QuoraQuestionAccountDetails.question_id), QuoraQuestion.asked_on).join(QuoraQuestion).filter(QuoraQuestion.disregard.is_(False))
    if account_id is not None:
        query = query.filter(QuoraQuestionAccountDetails.account_id == account_id)
    details = query.filter(and_(
        QuoraQuestionAccountDetails.action_id == action_object.id,
        QuoraQuestion.asked_on > get_time_interval(TimePeriod.MONTH.value, 1))).group_by(QuoraQuestion.asked_on).all()
    response = convert_question_count_array_to_json(details)
    session.close()
    return response

def get_asked_questions_sample_excel():
    session = get_new_session()
    accounts = session.query(QuoraAccount).order_by(desc(QuoraAccount.id)).all()
    account_name_list = []
    division_name_list = []
    for account in accounts:
        account_name_list.append(account.first_name + " " + account.last_name + " (" + str(account.id) + ")")
    divisions = session.query(Division).order_by(asc(Division.id)).all()
    for division in divisions:
        division_name_list.append(division.division + ' (' + str(division.id) + ')')
    dataframe = pandas.DataFrame(columns=quora_asked_question_excel_headers)
    strIO = io.BytesIO()
    excel_writer = pandas.ExcelWriter(strIO, engine="xlsxwriter")
    dataframe.to_excel(excel_writer, sheet_name="sheet 1", index=False)
    worksheet = excel_writer.sheets["sheet 1"]
    worksheet.write(0, 10, "Divisons (only for reference)")
    worksheet.write_column('K2', division_name_list)
    worksheet.write(0, 12, "Accounts (only for reference)")
    worksheet.write_column('M2', account_name_list)
    worksheet.set_column(10, 13, None, None, {'hidden': True})
    worksheet.data_validation(1, 0, 1001, 0, {'validate': 'length', 'criteria': '>', 'minimum': '5', 'input_message': 'Fill up to 1000 Rows only'})
    worksheet.data_validation(1, 1, 1001, 1, {'validate': 'length', 'criteria': '>', 'minimum': '5', 'input_message': 'Text of the question as displayed on Quora'})
    worksheet.data_validation(1, 2, 1001, 2, {'validate': 'list', 'source': '=$K$2:$K$' + str(len(division_name_list) + 1)})
    worksheet.data_validation(1, 3, 1001, 3, {'validate': 'list', 'source': '=$M$2:$M$' + str(len(account_name_list) + 1)})
    worksheet.data_validation(1, 4, 1001, 4, {'validate': 'date', 'criteria': '>', 'minimum': get_time_interval(TimePeriod.MONTH.value, 1), 'input_title': 'Enter a date after',
                                              'input_message': get_time_interval(TimePeriod.MONTH.value, 1).date().__format__('%d %b, %Y').__str__()})
    excel_writer.save()
    strIO.seek(0)
    session.close()
    return strIO

def upload_asked_questions(file):
    df = pandas.read_excel(file, engine='openpyxl')
    df = df[quora_asked_question_excel_headers]
    df = df.dropna(how='all')
    if set(df.columns.values.tolist()) != set(quora_asked_question_excel_headers) or df[quora_asked_question_excel_headers].isnull().values.any() or len(df.index) == 0 or len(df.index) > 1000:
        return False
    session = get_new_session()
    asked_action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == QuoraQuestionAccountAction.ASKED).first()
    for index, row in df.iterrows():
        persisted_question = session.query(QuoraQuestion).filter(QuoraQuestion.question_url.like(row['Question Url'])).first()
        account_id = row['Account'][row['Account'].index('(')+1: row['Account'].index(')')]
        if persisted_question is None:
            persisted_question = QuoraQuestion()
            persisted_question.question_url = row['Question Url'].encode(config.encoding)
            persisted_question.question_text = row['Question Text'].encode(config.encoding)
            persisted_question.asked_on = row['Asked On']
            persisted_question.division_id = row['Division'][row['Division'].index('(')+1: row['Division'].index(')')]
            session.add(persisted_question)
            persisted_qqad = None
        else:
            persisted_qqad = session.query(QuoraQuestionAccountDetails).filter(and_(
                QuoraQuestionAccountDetails.question_id == persisted_question.id,
                QuoraQuestionAccountDetails.account_id == account_id,
                QuoraQuestionAccountDetails.action_id == asked_action_object.id)).first()
        if persisted_qqad is None:
            qqad = QuoraQuestionAccountDetails()
            qqad.question = persisted_question
            qqad.action = asked_action_object
            qqad.account_id = account_id
            session.add(qqad)
        persisted_archieved_question = session.query(QuoraQuestionsArchieve).filter(QuoraQuestionsArchieve.question_url.like(row['Question Url'])).first()
        if persisted_archieved_question is None:
            persisted_archieved_question = QuoraQuestionsArchieve()
            persisted_archieved_question.question_url = row['Question Url'].encode(config.encoding)
            persisted_archieved_question.question_text = row['Question Text'].encode(config.encoding)
            session.add(persisted_archieved_question)
            persisted_archieved_qqaad = None
        else:
            persisted_archieved_qqaad = session.query(QuoraQuestionArchieveAccountDetails).filter(and_(
                QuoraQuestionArchieveAccountDetails.question_id == persisted_archieved_question.id,
                QuoraQuestionArchieveAccountDetails.account_id == account_id,
                QuoraQuestionArchieveAccountDetails.action_id == asked_action_object.id)).first()
        if persisted_archieved_qqaad is None:
            qqaad = QuoraQuestionArchieveAccountDetails()
            qqaad.question = persisted_archieved_question
            qqaad.action = asked_action_object
            qqaad.account_id = account_id
            session.add(qqaad)
    session.commit()
    session.close()
    return True

def get_last_refreshed():
    session = get_new_session()
    script = session.query(Script).filter(Script.name == 'Refresh_Quora_Stats').first()
    execution_log = session.query(ExecutionLog).filter(ExecutionLog.script_id == script.id).first()
    if execution_log is None:
        response = {}
    else:
        response = execution_log._asdict()
    session.close()
    return response

def get_all_keywords():
    session = get_new_session()
    keywords = session.query(QuoraKeyword).order_by(QuoraKeyword.keyword).all()
    response = convert_list_to_json(keywords)
    session.close()
    return response

def delete_keyword(keyword):
    session = get_new_session()
    session.query(QuoraKeyword).filter(QuoraKeyword.keyword.like(keyword)).delete(synchronize_session=False)
    session.commit()
    session.close()
    return {}

def add_keyword(keyword, division_id):
    session = get_new_session()
    new_keyword = QuoraKeyword()
    new_keyword.division_id = division_id
    new_keyword.keyword = keyword
    response = new_keyword._asdict()
    session.add(new_keyword)
    session.commit()
    session.close()
    return response

def get_archieved_questions_by_question_id(question_ids):
    session = get_new_session()
    questions = session.query(QuoraQuestionsArchieve).filter(QuoraQuestionsArchieve.id.in_(question_ids)).all()
    response = convert_list_to_json(questions)
    session.close()
    return response

def get_archieved_questions(keywords, page_number, page_size, action, account_id):
    session = get_new_session()
    action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action == action).first()
    query = session.query(QuoraQuestionsArchieve).join(QuoraQuestionArchieveAccountDetails).filter(
        QuoraQuestionArchieveAccountDetails.action_id == action_object.id)
    if keywords is not None and len(keywords) > 0:
        search_string = ''
        for keyword in keywords:
            search_string += keyword + ', '
        search_string = search_string[:-2]
        query = query.filter(QuoraQuestionsArchieve.question_text.match(search_string))
    if account_id is not None:
        query = query.filter(QuoraQuestionArchieveAccountDetails.account_id == account_id)
    length, paginated_query = paginate(query=query, page_number=int(page_number), page_limit=int(page_size))
    questions_array = paginated_query.all()
    response_array = []
    for question in questions_array:
        response_object = {}
        response_object['question_url'] = question.question_url
        response_object['question_text'] = question.question_text
        response_object['id'] = question.id
        if action == QuoraQuestionAccountAction.ANSWERED.__str__():
            response_object['answered_account_ids'] = []
            for detail in question.accounts:
                if detail.action_id == action_object.id:
                    response_object['answered_account_ids'].append(detail.account_id)
        elif action == QuoraQuestionAccountAction.ASKED.__str__():
            for detail in question.accounts:
                if detail.action_id == action_object.id:
                    response_object['asked_account_id'] = detail.account_id
                    break
            stat = session.query(QuoraAskedQuestionArchieveStats).filter(QuoraAskedQuestionArchieveStats.question_id == question.id)\
                .order_by(desc(QuoraAskedQuestionArchieveStats.recorded_on)).first()
            if stat is not None:
                response_object['asked_question_stats'] = stat._asdict()
        response_array.append(response_object)
    response = {'totalLength': length, 'content': response_array}
    session.close()
    return response

def delete_archieved_question(question_id, account_id, action):
    session = get_new_session()
    action_object = session.query(QuoraQuestionAccountActions).filter(QuoraQuestionAccountActions.action.like(action)).first()
    session.query(QuoraQuestionArchieveAccountDetails).filter(and_(
        QuoraQuestionArchieveAccountDetails.question_id == question_id,
        QuoraQuestionArchieveAccountDetails.account_id == account_id,
        QuoraQuestionArchieveAccountDetails.action_id == action_object.id)).delete(synchronize_session=False)
    remaining_details = session.query(QuoraQuestionArchieveAccountDetails).filter(
        QuoraQuestionArchieveAccountDetails.question_id == question_id).all()
    if (remaining_details is None or len(remaining_details) == 0):
        session.query(QuoraAskedQuestionArchieveStats).filter(QuoraAskedQuestionArchieveStats.question_id == question_id)\
            .delete(synchronize_session=False)
        session.query(QuoraQuestionsArchieve).filter(QuoraQuestionsArchieve.id == question_id).delete(synchronize_session=False)
    session.commit()
    session.close()
    return {}
