import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private backendUrl = 'http://localhost:5000'

  constructor() { }

  getBackendUrl(): string {
    return this.backendUrl;
  }

  getParameters(params: {}): HttpParams {
    let parameters = new HttpParams();
    for (var element in params) {
      if (params[element] instanceof Array) {
        parameters = parameters.append(element, JSON.stringify(params[element]));
      }
      else {
        parameters = parameters.append(element, params[element]);
      }
    }
    return parameters;
  }
}
