import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Division } from '../shared/models/division.model';
import { ApiService } from '../shared/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class DivisionService {

  constructor(private _http: HttpClient, private _apiService: ApiService) { }

  getAllDivision(): Observable<Division[]> {
    return this._http.get<Division[]>(this._apiService.getBackendUrl() + '/division');
  }
}
