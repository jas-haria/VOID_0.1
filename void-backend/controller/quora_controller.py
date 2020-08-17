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
def delete_questions():
    return Response(json.dumps(quora_service.delete_questions(ast.literal_eval(request.args.get('questionIds')))), status=200, mimetype='application/json')

#to be changed
@app.route(base_url+'/update', methods=['PUT'])
def update_qqad():
    return Response(json.dumps(quora_service.update_qqad(ast.literal_eval(request.args.get('questionIds')), request.args.get('action'), request.args.get('accountId'))), status=200, mimetype='application/json')

@app.route(base_url, methods=['GET'])
def get_questions():
    return Response(json.dumps(quora_service.get_questions(ast.literal_eval(request.args.get('divisions')), request.args.get('timePeriod'), request.args.get('pageNumber'), request.args.get('pageSize'), request.args.get('action'))), status=200, mimetype='application/json')

@app.route(base_url+'/askedQuestionsStats', methods=['GET'])
def get_asked_questions_stats():
    return Response(json.dumps(quora_service.get_asked_questions_stats(ast.literal_eval(request.args.get('questionIds')))), status=200, mimetype='application/json')

@app.route(base_url+'/refreshAccountsData', methods=['GET'])
def refresh_accounts_data():
    return Response(json.dumps(quora_service.refresh_accounts_data()), status=200, mimetype='application/json')

@app.route(base_url+'/refreshRequestedQuestions', methods=['GET'])
def refresh_requested_questions():
    return Response(json.dumps(quora_service.refresh_requested_questions()), status=200, mimetype='application/json')

@app.route(base_url, methods=['POST'])
def add_asked_question():
    return Response(json.dumps(quora_service.add_asked_question(request.json, request.args.get('account_id'))), status=200, mimetype='application/json')

@app.route(base_url+'/refreshAskedQuestionsStats', methods=['GET'])
def refresh_asked_questions_stats():
    return Response(json.dumps(quora_service.refresh_asked_questions_stats()), status=200, mimetype='application/json')

@app.route(base_url+'/refreshAccountStats', methods=['GET'])
def refresh_accounts_stats():
    return Response(json.dumps(quora_service.refresh_accounts_stats('week')), status=200, mimetype='application/json')

@app.route(base_url+'/excel', methods=['GET'])
def generate_questions_excel():
    return send_file(util_service.generate_excel(quora_service.generate_questions_df_for_excel(
        ast.literal_eval(request.args.get('questionIds')), bool(strtobool(request.args.get('currentPage'))), ast.literal_eval(request.args.get('divisions')), request.args.get('timePeriod') )),
                     as_attachment=True, attachment_filename='excel.xlsx')

@app.route(base_url+'/accounts', methods=['GET'])
def get_accounts():
    return Response(json.dumps(quora_service.get_accounts(request.args.get('id'))), status=200, mimetype='application/json')