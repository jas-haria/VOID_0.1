from flask import Response, request, send_file
import json
import ast
from distutils.util import strtobool

from controller import app_controller
from service import quora_service, util_service

app = app_controller.app

base_url = '/quora'

@app.route(base_url+'/refreshQuestions', methods=['GET'])
def refresh_questions_data():
    return Response(json.dumps(quora_service.refresh_data('week', True)), status=200, mimetype='application/json')

@app.route(base_url+'/fillAllMissingDates', methods=['GET'])
def fill_all_missing_dates():
    return Response(json.dumps(quora_service.fill_missing_dates()), status=200, mimetype='application/json')

@app.route(base_url+'/disregard', methods=['PUT'])
def disregard_questions():
    return Response(json.dumps(quora_service.disregard_questions(ast.literal_eval(request.args.get('questionIds')))), status=200, mimetype='application/json')

@app.route(base_url+'/update', methods=['PUT'])
def update_qqad():
    return Response(json.dumps(quora_service.update_qqad(ast.literal_eval(request.args.get('questionIds')), request.args.get('action'), request.args.get('accountId'))), status=200, mimetype='application/json')

@app.route(base_url+'/update', methods=['DELETE'])
def delete_qqad():
    return Response(json.dumps(quora_service.delete_qqad(ast.literal_eval(request.args.get('questionIds')), request.args.get('action'), request.args.get('accountId'))), status=200, mimetype='application/json')

@app.route(base_url+'/pass', methods=['PUT'])
def add_pass_qqad():
    return Response(json.dumps(quora_service.add_pass_qqad(ast.literal_eval(request.args.get('questionIds')), request.args.get('accountId'))), status=200, mimetype='application/json')


@app.route(base_url, methods=['GET'])
def get_questions():
    return Response(json.dumps(quora_service.get_questions(ast.literal_eval(request.args.get('divisions')), request.args.get('timePeriod'), request.args.get('pageNumber'), request.args.get('pageSize'), request.args.get('action'), request.args.get('accountId'))), status=200, mimetype='application/json')

@app.route(base_url+'/askedQuestionsStats', methods=['GET'])
def get_asked_questions_stats():
    questionIds = None
    if request.args.get('questionIds') is not None:
        questionIds = ast.literal_eval(request.args.get('questionIds'))
    return Response(json.dumps(quora_service.get_asked_questions_stats(questionIds, bool(strtobool(request.args.get('lastWeek'))))), status=200, mimetype='application/json')

@app.route(base_url+'/refreshAccountsData', methods=['GET'])
def refresh_accounts_data():
    return Response(json.dumps(quora_service.refresh_accounts_data()), status=200, mimetype='application/json')

@app.route(base_url+'/passRequestedQuestions', methods=['GET'])
def pass_requested_questions():
    return Response(json.dumps(quora_service.pass_requested_questions()), status=200, mimetype='application/json')

@app.route(base_url+'/refreshRequestedQuestions', methods=['GET'])
def refresh_requested_questions():
    return Response(json.dumps(quora_service.refresh_requested_questions()), status=200, mimetype='application/json')

@app.route(base_url+'/refreshAskedQuestionsStats', methods=['GET'])
def refresh_asked_questions_stats():
    return Response(json.dumps(quora_service.refresh_asked_questions_stats()), status=200, mimetype='application/json')

@app.route(base_url+'/refreshAccountStats', methods=['GET'])
def refresh_accounts_stats():
    return Response(json.dumps(quora_service.refresh_accounts_stats()), status=200, mimetype='application/json')

@app.route(base_url+'/pending-questions-excel', methods=['GET'])
def generate_pending_questions_excel():
    return send_file(quora_service.generate_pending_questions_df_for_excel(request.args.get('accountId')),
                     as_attachment=True, attachment_filename='excel.xlsx')

@app.route(base_url+'/accounts', methods=['GET'])
def get_accounts():
    return Response(json.dumps(quora_service.get_accounts(request.args.get('id'))), status=200, mimetype='application/json')

@app.route(base_url+'/accounts/stats', methods=['GET'])
def get_quora_accounts_stats():
    return Response(json.dumps(quora_service.get_quora_accounts_stats(request.args.get('accountId'))), status=200, mimetype='application/json')

@app.route(base_url+'/accounts/questions-count', methods=['GET'])
def get_quora_questions_count():
    return Response(json.dumps(quora_service.get_quora_questions_count(request.args.get('action'), request.args.get('accountId'))), status=200, mimetype='application/json')

@app.route(base_url+'/asked-questions-sample-excel', methods=['GET'])
def get_asked_questions_sample_excel():
    return send_file(quora_service.get_asked_questions_sample_excel(),
                     as_attachment=True, attachment_filename='excel.xlsx')

@app.route(base_url+'/upload-quora-asked-questions', methods=['POST'])
def upload_asked_questions():
    return Response(json.dumps(quora_service.upload_asked_questions(request.files['file'])), status=200, mimetype='application/json')

@app.route(base_url+'/last-refreshed', methods=['GET'])
def get_last_refreshed():
    return Response(json.dumps(quora_service.get_last_refreshed()), status=200, mimetype='application/json')

@app.route(base_url+'/refresh-all', methods=['GET'])
def refresh_all():
    return Response(json.dumps(quora_service.refresh_all_stats()), status=200, mimetype='application/json')