from flask import Response, request, send_file
import json
import ast
from distutils.util import strtobool

from authentication.authenticator import requires_auth
from controller import app_controller
from service import quora_service
import config

app = app_controller.app

base_url = config.base_api + '/quora'

@app.route(base_url+'/disregard', methods=['PUT'])
@requires_auth
def disregard_questions():
    return Response(json.dumps(quora_service.disregard_questions(ast.literal_eval(request.args.get('questionIds')))), status=200, mimetype='application/json')

@app.route(base_url+'/update', methods=['PUT'])
@requires_auth
def update_qqad():
    return Response(json.dumps(quora_service.update_qqad(ast.literal_eval(request.args.get('questionIds')), request.args.get('action'), request.args.get('accountId'))), status=200, mimetype='application/json')

@app.route(base_url+'/update', methods=['DELETE'])
@requires_auth
def delete_qqad():
    return Response(json.dumps(quora_service.delete_qqad(ast.literal_eval(request.args.get('questionIds')), request.args.get('action'), request.args.get('accountId'))), status=200, mimetype='application/json')

@app.route(base_url+'/pass', methods=['PUT'])
@requires_auth
def add_pass_qqad():
    return Response(json.dumps(quora_service.add_pass_qqad(ast.literal_eval(request.args.get('questionIds')), request.args.get('accountId'))), status=200, mimetype='application/json')


@app.route(base_url, methods=['GET'])
@requires_auth
def get_questions():
    return Response(json.dumps(quora_service.get_questions(ast.literal_eval(request.args.get('divisions')), request.args.get('timePeriod'), request.args.get('pageNumber'), request.args.get('pageSize'), request.args.get('action'), request.args.get('accountId'))), status=200, mimetype='application/json')

@app.route(base_url+'/asked-questions-stats', methods=['GET'])
@requires_auth
def get_asked_questions_stats():
    questionIds = None
    if request.args.get('questionIds') is not None:
        questionIds = ast.literal_eval(request.args.get('questionIds'))
    return Response(json.dumps(quora_service.get_asked_questions_archieve_stats(questionIds, bool(strtobool(request.args.get('lastWeek'))))), status=200, mimetype='application/json')

# HAS SOME ISSUE
@app.route(base_url+'/pending-questions-excel', methods=['GET'])
@requires_auth
def generate_pending_questions_excel():
    return send_file(quora_service.generate_pending_questions_df_for_excel(request.args.get('accountId')),
                     as_attachment=True, attachment_filename='excel.xlsx')

@app.route(base_url+'/accounts', methods=['GET'])
@requires_auth
def get_accounts():
    return Response(json.dumps(quora_service.get_accounts(request.args.get('id'))), status=200, mimetype='application/json')

@app.route(base_url+'/accounts/stats', methods=['GET'])
@requires_auth
def get_quora_accounts_stats():
    return Response(json.dumps(quora_service.get_quora_accounts_stats(request.args.get('accountId'))), status=200, mimetype='application/json')

@app.route(base_url+'/accounts/questions-count', methods=['GET'])
@requires_auth
def get_quora_questions_count():
    return Response(json.dumps(quora_service.get_quora_questions_count(request.args.get('action'), request.args.get('accountId'))), status=200, mimetype='application/json')

@app.route(base_url+'/asked-questions-sample-excel', methods=['GET'])
@requires_auth
def get_asked_questions_sample_excel():
    return send_file(quora_service.get_asked_questions_sample_excel(),
                     as_attachment=True, attachment_filename='excel.xlsx')

@app.route(base_url+'/upload-quora-asked-questions', methods=['POST'])
@requires_auth
def upload_asked_questions():
    return Response(json.dumps(quora_service.upload_asked_questions(request.files['file'])), status=200, mimetype='application/json')

@app.route(base_url+'/last-refreshed', methods=['GET'])
@requires_auth
def get_last_refreshed():
    return Response(json.dumps(quora_service.get_last_refreshed()), status=200, mimetype='application/json')

# @app.route(base_url+'/refresh-all', methods=['GET'])
# @requires_auth
# def refresh_all():
#     return Response(json.dumps(quora_scraping_service.refresh_all_stats()), status=200, mimetype='application/json')

@app.route(base_url+'/keyword', methods=['GET'])
@requires_auth
def get_all_keywords():
    return Response(json.dumps(quora_service.get_all_keywords()), status=200, mimetype='application/json')

@app.route(base_url+'/keyword', methods=['DELETE'])
@requires_auth
def delete_keyword():
    return Response(json.dumps(quora_service.delete_keyword(request.args.get('keyword'))), status=200, mimetype='application/json')

@app.route(base_url+'/keyword', methods=['POST'])
@requires_auth
def add_keyword():
    return Response(json.dumps(quora_service.add_keyword(request.args.get('keyword'), request.args.get('division_id'))), status=200, mimetype='application/json')

@app.route(base_url+'/archieved', methods=['GET'])
@requires_auth
def get_archieved():
    return Response(json.dumps(quora_service.get_archieved_questions(ast.literal_eval(request.args.get('keywords')),  request.args.get('pageNumber'), request.args.get('pageSize'), request.args.get('action'), request.args.get('accountId'))), status=200, mimetype='application/json')

@app.route(base_url+'/archieved-questions', methods=['GET'])
@requires_auth
def get_archieved_questions_by_id():
    return Response(json.dumps(quora_service.get_archieved_questions_by_question_id(ast.literal_eval(request.args.get('questionIds')))), status=200, mimetype='application/json')

@app.route(base_url+'/archieved', methods=['DELETE'])
@requires_auth
def delete_archieved():
    return Response(json.dumps(quora_service.delete_archieved_question(request.args.get('questionId'), request.args.get('accountId'), request.args.get('action'))), status=200, mimetype='application/json')


# @app.route(base_url+'/refreshQuestions', methods=['GET'])
# def refresh_questions_data():
#     return Response(json.dumps(quora_scraping_service.refresh_data('week', True)), status=200, mimetype='application/json')
#
# @app.route(base_url+'/fillAllMissingDates', methods=['GET'])
# def fill_all_missing_dates():
#     return Response(json.dumps(quora_scraping_service.fill_missing_dates()), status=200, mimetype='application/json')

# @app.route(base_url+'/refreshAccountsData', methods=['GET'])
# def refresh_accounts_data():
#     return Response(json.dumps(quora_scraping_service.refresh_accounts_data()), status=200, mimetype='application/json')
#
# @app.route(base_url+'/passRequestedQuestions', methods=['GET'])
# def pass_requested_questions():
#     return Response(json.dumps(quora_scraping_service.pass_requested_questions()), status=200, mimetype='application/json')
#
# @app.route(base_url+'/refreshRequestedQuestions', methods=['GET'])
# def refresh_requested_questions():
#     return Response(json.dumps(quora_scraping_service.refresh_requested_questions()), status=200, mimetype='application/json')
#
# @app.route(base_url+'/refreshAskedQuestionsStats', methods=['GET'])
# def refresh_asked_questions_stats():
#     return Response(json.dumps(quora_scraping_service.refresh_asked_questions_stats()), status=200, mimetype='application/json')
#
# @app.route(base_url+'/refreshAccountStats', methods=['GET'])
# def refresh_accounts_stats():
#     return Response(json.dumps(quora_scraping_service.refresh_accounts_stats()), status=200, mimetype='application/json')