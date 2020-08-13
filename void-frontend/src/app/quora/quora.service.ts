import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../shared/services/api.service';
import { QuoraQuestion } from '../shared/models/quora-question.model';
import { Page } from '../shared/models/page.model';
import { TimePeriod } from '../shared/models/enums/time-period.enum';
import { QuoraAccount } from '../shared/models/quora-account.model';
import { QuoraQuestionAccountAction } from '../shared/models/enums/quora-question-account-action.enum';
import { QuoraAskedQuestionStats } from '../shared/models/quora-asked-question-stats.model';

@Injectable({
  providedIn: 'root'
})
export class QuoraService {
  
  constructor(private _http: HttpClient, private _apiService: ApiService) {}

  getQuestions(pageNumber: number, pageSize: number, divisions: number[], timePeriod: TimePeriod, qqaa: QuoraQuestionAccountAction): Observable<Page<QuoraQuestion>> {
    let parameters = {};
    parameters['pageNumber'] = pageNumber;
    parameters['pageSize'] = pageSize;
    parameters['divisions'] = divisions;
    parameters['timePeriod'] = timePeriod;
    parameters['action'] = qqaa
    return this._http.get<Page<QuoraQuestion>>(this._apiService.getBackendUrl() + '/quora', 
    { params: this._apiService.getParameters(parameters) });
  }

  updateQuestionsEvaluation(questionIds: number[], evaluated: boolean): Observable<any> {
    let parameters = {};
    parameters['questionIds'] = questionIds;
    parameters['evaluated'] =  evaluated;
    return this._http.put<any>(this._apiService.getBackendUrl() + '/quora/evaluate', {}, 
    { params: this._apiService.getParameters(parameters) });
  }

  disregardQuestion(questionIds: number[]): Observable<any> {
    let parameters = {};
    parameters['questionIds'] = questionIds;
    return this._http.put<any>(this._apiService.getBackendUrl() + '/quora/disregard', {},
    { params: this._apiService.getParameters(parameters) });
  }

  downloadExcel(currentPage: boolean, questionIds: number[], divisions: number[], timePeriod: TimePeriod): Observable<any> {
    let parameters = {};
    parameters['currentPage'] = currentPage;
    parameters['questionIds'] = questionIds;
    parameters['divisions'] = divisions;
    parameters['timePeriod'] = timePeriod;
    return this._http.get(this._apiService.getBackendUrl() + '/quora/excel',
    { params: this._apiService.getParameters(parameters), responseType: "arraybuffer" });
  }

  getAccounts(): Observable<QuoraAccount[]> {
    return this._http.get<QuoraAccount[]>(this._apiService.getBackendUrl() + '/quora/accounts');
  }

  getAskedQuestionsStats(questionIds: number[]): Observable<QuoraAskedQuestionStats[]> {
    let parameters = {};
    parameters['questionIds'] = questionIds;
    return this._http.get<QuoraAskedQuestionStats[]>(this._apiService.getBackendUrl() + '/quora/askedQuestionsStats',
    { params: this._apiService.getParameters(parameters) })
  }
}
