import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { ApiService } from '../shared/services/api/api.service';
import { QuoraQuestion } from '../shared/models/quora-question.model';
import { Page } from '../shared/models/page.model';
import { TimePeriod } from '../shared/models/enums/time-period.enum';
import { QuoraAccount } from '../shared/models/quora-account.model';
import { QuoraQuestionAccountAction } from '../shared/models/enums/quora-question-account-action.enum';
import { QuoraAskedQuestionStats } from '../shared/models/quora-asked-question-stats.model';
import { QuoraAccountsStats } from '../shared/models/quora-accounts-stats.model';
import { QuoraQuestionCount } from '../shared/models/quora-question-count.model';
import { ExecutionLog } from '../shared/models/execution-log.model';
import { QuoraKeyword } from '../shared/models/quora-keyword';

@Injectable({
  providedIn: 'root'
})
export class QuoraService {

  baseUrl: string = "/quora";

  constructor(private _http: HttpClient,
    private _apiService: ApiService) { }

  getQuestions(pageNumber: number, pageSize: number, divisions: number[], timePeriod: TimePeriod, qqaa: QuoraQuestionAccountAction, accountId: Number): Observable<Page<QuoraQuestion>> {
    let parameters = {};
    parameters['pageNumber'] = pageNumber;
    parameters['pageSize'] = pageSize;
    parameters['divisions'] = divisions;
    parameters['timePeriod'] = timePeriod;
    parameters['action'] = qqaa
    if (accountId) {
      parameters['accountId'] = accountId;
    }
    return <Observable<Page<QuoraQuestion>>>this._apiService.createRequest('get', this.baseUrl, parameters, null, false, null);
  }

  updateQuestionAndAccountAction(questionIds: number[], action: QuoraQuestionAccountAction, accountId: number): Observable<any> {
    let parameters = {};
    parameters['questionIds'] = questionIds;
    parameters['action'] = action;
    parameters['accountId'] = accountId;
    return <Observable<any>>this._apiService.createRequest('put', this.baseUrl + '/update', parameters, null, false, null);
  }

  passQuoraQuestions(questionIds: number[], accountId: number): Observable<any> {
    let parameters = {};
    parameters['questionIds'] = questionIds;
    if (accountId) {
      parameters['accountId'] = accountId;
    }
    return <Observable<any>>this._apiService.createRequest('put', this.baseUrl + '/pass', parameters, null, false, null);
  }

  deleteQuestionAndAccountAction(questionIds: number[], action: QuoraQuestionAccountAction, accountId: number): Observable<any> {
    let parameters = {};
    parameters['questionIds'] = questionIds;
    parameters['action'] = action;
    parameters['accountId'] = accountId;
    return <Observable<any>>this._apiService.createRequest('delete', this.baseUrl + '/update', parameters, null, false, null);
  }

  disregardQuestion(questionIds: number[]): Observable<any> {
    let parameters = {};
    parameters['questionIds'] = questionIds;
    return <Observable<any>>this._apiService.createRequest('put', this.baseUrl + '/disregard', parameters, null, false, null);
  }

  downloadPendingQuestionsExcel(accountId: number): Observable<any> {
    let parameters = {};
    parameters['accountId'] = accountId;
    return <Observable<any>>this._apiService.createRequest('get', this.baseUrl + '/pending-questions-excel', null, null, true, 'arraybuffer');
  }

  downloadTemplateExcel(): Observable<any> {
    return <Observable<any>>this._apiService.createRequest('get', this.baseUrl + '/asked-questions-sample-excel', null, null, true, 'arraybuffer');
  }

  getAccounts(): Observable<QuoraAccount[]> {
    return <Observable<QuoraAccount[]>>this._apiService.createRequest('get', this.baseUrl + '/accounts', null, null, false, null);
  }

  getAccount(id: number): Observable<QuoraAccount> {
    let parameters = {};
    parameters['id'] = id;
    return <Observable<QuoraAccount>>this._apiService.createRequest('get', this.baseUrl + '/accounts', parameters, null, false, null);

  }

  getAskedQuestionsStats(lastWeek: boolean, questionIds?: number[]): Observable<QuoraAskedQuestionStats[]> {
    let parameters = {};
    parameters['lastWeek'] = lastWeek;
    if (questionIds) {
      parameters['questionIds'] = questionIds;
    }
    return <Observable<QuoraAskedQuestionStats[]>>this._apiService.createRequest('get', this.baseUrl + '/asked-questions-stats', parameters, null, false, null);
  }

  getAccountStats(accountId?: number): Observable<QuoraAccountsStats[]> {
    let parameters = {};
    if (accountId) {
      parameters['accountId'] = accountId;
    }
    return <Observable<QuoraAccountsStats[]>>this._apiService.createRequest('get', this.baseUrl + '/accounts/stats', parameters, null, false, null);
  }

  getQuestionsCount(action: QuoraQuestionAccountAction, accountId?: number): Observable<QuoraQuestionCount[]> {
    let parameters = {};
    parameters['action'] = action;
    if (accountId) {
      parameters['accountId'] = accountId;
    }
    return <Observable<QuoraQuestionCount[]>>this._apiService.createRequest('get', this.baseUrl + '/accounts/questions-count', parameters, null, false, null);
  }

  uploadQuoraAskedQuestionsFile(formData: FormData): Observable<boolean> {
    return <Observable<boolean>>this._apiService.createRequest('post', this.baseUrl + '/upload-quora-asked-questions', null, formData, false, null);
  }

  refreshAllStats(): Observable<ExecutionLog> {
    return <Observable<ExecutionLog>>this._apiService.createRequest('get', this.baseUrl + '/refresh-all', null, null, false, null);
  }

  getLastRefreshed(): Observable<ExecutionLog> {
    return <Observable<ExecutionLog>>this._apiService.createRequest('get', this.baseUrl + '/last-refreshed', null, null, false, null);
  }

  getKeywords(): Observable<QuoraKeyword[]> {
    return <Observable<QuoraKeyword[]>>this._apiService.createRequest('get', this.baseUrl + '/keyword', null, null, true, null);
  }

  deleteKeyword(keyword: string): Observable<any> {
    let parameters = {};
    parameters['keyword'] = keyword;
    return <Observable<any>>this._apiService.createRequest('delete', this.baseUrl + '/keyword', parameters, null, false, null);
  }

  addKeyWord(keyword: string, division_id: number): Observable<QuoraKeyword> {
    let parameters = {};
    parameters['keyword'] = keyword;
    parameters['division_id'] = division_id;
    return <Observable<QuoraKeyword>>this._apiService.createRequest('post', this.baseUrl + '/keyword', parameters, null, false, null);
  }
}
