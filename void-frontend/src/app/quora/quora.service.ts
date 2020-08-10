import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../shared/services/api.service';
import { QuoraQuestion } from '../shared/models/quora-question.model';
import { Page } from '../shared/models/page.model';
import { TimePeriod } from '../shared/models/enums/time-period.enum';

@Injectable({
  providedIn: 'root'
})
export class QuoraService {
  
  constructor(private _http: HttpClient, private _apiService: ApiService) {}

  getQuestions(pageNumber: number, pageSize: number, divisions: number[], evaluated: boolean, timePeriod: TimePeriod): Observable<Page<QuoraQuestion>> {
    let parameters = {};
    parameters['pageNumber'] = pageNumber;
    parameters['pageSize'] = pageSize;
    parameters['divisions'] = divisions;
    parameters['evaluated'] = evaluated;
    parameters['timePeriod'] = timePeriod;
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

  deleteQuestions(questionIds: number[]): Observable<any> {
    let parameters = {};
    parameters['questionIds'] = questionIds;
    return this._http.delete<any>(this._apiService.getBackendUrl() + '/quora',
    { params: this._apiService.getParameters(parameters) });
  }

  downloadExcel(currentPage: boolean, questionIds: number[], divisions: number[], timePeriod: TimePeriod): Observable<any> {
    let parameters = {};
    parameters['currentPage'] = currentPage;
    parameters['questionIds'] = questionIds;
    parameters['divisions'] = divisions;
    parameters['timePeriod'] = timePeriod;
    return this._http.get(this._apiService.getBackendUrl() + '/quora/getExcel',
    { params: this._apiService.getParameters(parameters), responseType: "arraybuffer" });
  }
}
