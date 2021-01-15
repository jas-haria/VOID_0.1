import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../shared/services/api/api.service';
import { Page } from '../shared/models/page.model';
import { TimePeriod } from '../shared/models/enums/time-period.enum';
import { Gmb } from '../shared/models/gmb.model';

@Injectable({
  providedIn: 'root'
})
export class GmbService {
  
  constructor(private _http: HttpClient, private _apiService: ApiService) {}

  getGmbInsights(): Observable<any> {
    return this._http.get<any>(this._apiService.getBackendUrl() + '/gmb/insights');
  }

  getGmbCentre(): Observable<Gmb> {
    return this._http.get<Gmb>(this._apiService.getBackendUrl() + '/gmb/centre');
  }

  getGmbSeo(): Observable<Gmb> {
    return this._http.get<Gmb>(this._apiService.getBackendUrl() + '/gmb/seo');
  }

}
