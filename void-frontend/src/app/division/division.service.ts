import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Division } from '../shared/models/division.model';
import { ApiService } from '../shared/services/api/api.service';

@Injectable({
  providedIn: 'root'
})
export class DivisionService {

  baseUrl: string = "/division";

  constructor(private _apiService: ApiService) { }

  getAllDivision(): Observable<Division[]> {
    return <Observable<Division[]>> this._apiService.createRequest('get', this.baseUrl, null, null, false, null);
  }
}
